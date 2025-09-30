import {
  creatAzureADB2COAuthConfig,
  createAzureADOAuthConfig,
  createGitHubOAuthConfig,
  createOAuthHelpers,
  creatOAuthConfig,
  DenoKVOAuth,
  EaCApplicationsRuntimeContext,
  EaCProviderAsCode,
  EaCRuntimeContext,
  EaCRuntimeHandler,
  EverythingAsCode,
  EverythingAsCodeIdentity,
  isEaCAzureADB2CProviderDetails,
  isEaCAzureADProviderDetails,
  isEaCGitHubAppProviderDetails,
  isEaCOAuthProviderDetails,
  redirectRequest,
  UserOAuthConnection,
  userOAuthConnExpired,
} from "../.deps.ts";

export function loadOAuth2ClientConfig(
  provider: EaCProviderAsCode,
): DenoKVOAuth.OAuth2ClientConfig | undefined {
  let oAuthConfig: DenoKVOAuth.OAuth2ClientConfig | undefined = undefined;

  if (isEaCAzureADB2CProviderDetails(provider.Details)) {
    oAuthConfig = creatAzureADB2COAuthConfig(
      provider.Details.ClientID,
      provider.Details.ClientSecret,
      provider.Details.Domain,
      provider.Details.PolicyName,
      provider.Details.TenantID,
      provider.Details.Scopes,
    );
  } else if (isEaCAzureADProviderDetails(provider.Details)) {
    oAuthConfig = createAzureADOAuthConfig(
      provider.Details.ClientID,
      provider.Details.ClientSecret,
      provider.Details.TenantID,
      provider.Details.Scopes,
    );
  } else if (isEaCGitHubAppProviderDetails(provider.Details)) {
    oAuthConfig = createGitHubOAuthConfig(
      provider.Details.ClientID,
      provider.Details.ClientSecret,
      provider.Details.Scopes,
    );
  } else if (isEaCOAuthProviderDetails(provider.Details)) {
    oAuthConfig = creatOAuthConfig(
      provider.Details.ClientID,
      provider.Details.ClientSecret,
      provider.Details.AuthorizationEndpointURI,
      provider.Details.TokenURI,
      provider.Details.Scopes,
    );
  }

  return oAuthConfig;
}

export function establishOAuthMiddleware(
  providerLookup: string,
  signInPath: string,
): EaCRuntimeHandler {
  return (async (
    req,
    ctx: EaCApplicationsRuntimeContext<
      { Username?: string; AccessRights?: string[] },
      Record<string, unknown>,
      EverythingAsCode & EverythingAsCodeIdentity
    >,
  ) => {
    const provider = ctx.Runtime.EaC.Providers![providerLookup];

    const denoKv = await ctx.Runtime.IoC.Resolve(
      Deno.Kv,
      provider.DatabaseLookup,
    );

    const oAuthConfig = loadOAuth2ClientConfig(provider);

    if (!oAuthConfig) {
      throw new Error(
        `The provider '${providerLookup}' type cannot be handled in the oAuthMiddleware.`,
      );
    }

    let resp: Response | Promise<Response>;

    if (!ctx.Runtime.ApplicationProcessorConfig.ResolverConfig.IsPrivate) {
      resp = ctx.Next();
    } else {
      const helpers = createOAuthHelpers(oAuthConfig);

      const sessionId = await helpers.getSessionId(req);

      const forwardedPath = req.headers.get("x-eac-forwarded-path");

      const successPath = forwardedPath
        ? forwardedPath.startsWith("/") ? forwardedPath : `/${forwardedPath}`
        : (ctx.Runtime.URLMatch.Path?.startsWith("/")
          ? ctx.Runtime.URLMatch.Path
          : `/${ctx.Runtime.URLMatch.Path ?? ""}`) || "/";

      const successUrl = encodeURI(
        `${successPath}${ctx.Runtime.URLMatch.Search ?? ""}`,
      );

      const signInUrl = ctx.Runtime.URLMatch.FromBase(signInPath);
      const signInLocation = `${signInUrl.pathname}${signInUrl.search}`;
      const redirectSeparator = signInUrl.search ? "&" : "?";
      const notSignedInRedirect =
        `${signInLocation}${redirectSeparator}success_url=${successUrl}`;

      if (sessionId) {
        const currentUsername = await denoKv.get<UserOAuthConnection>([
          "OAuth",
          "User",
          sessionId,
          "Current",
        ]);

        if (!userOAuthConnExpired(currentUsername.value)) {
          ctx.State.Username = currentUsername.value!.Username;

          // Opportunistically resolve rights via IoC resolver; primary enforcement
          // occurs in authorization middleware.
          try {
            const sym = ctx.Runtime.IoC.Symbol("AccessRightsResolver");
            const resolver = await ctx.Runtime.IoC.Resolve<
              (
                ctx: EaCApplicationsRuntimeContext,
              ) => Promise<{ rights: string[] }>
            >(sym);
            if (resolver) {
              const { rights } = await resolver(
                ctx as unknown as EaCApplicationsRuntimeContext,
              );
              (ctx as unknown as EaCApplicationsRuntimeContext).Runtime
                .AccessRights = rights || [];
            }
          } catch (_) {
            // no-op if not registered
          }

          resp = ctx.Next();
        } else {
          resp = redirectRequest(notSignedInRedirect, false, false);
        }
      } else if (
        ctx.Runtime.ApplicationProcessorConfig.ResolverConfig.IsTriggerSignIn
      ) {
        resp = redirectRequest(notSignedInRedirect, false, false);
      } else {
        throw new Error("You are not authorized to access this endpoint.");
      }
    }

    return resp;
  }) as EaCRuntimeHandler;
}
