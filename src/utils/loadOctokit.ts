import {
  createAppAuth,
  createOAuthUserAuth,
  EaCGitHubAppAsCode,
  EaCGitHubAppDetails,
  EaCGitHubAppProviderDetails,
  EaCSourceConnectionDetails,
  EverythingAsCodeClouds,
  isEaCGitHubAppAsCode,
  isEaCGitHubAppDetails,
  isEaCGitHubAppProviderDetails,
  isEaCSourceConnectionDetails,
  isEverythingAsCodeClouds,
  loadMainSecretClient,
  loadSecretClient,
  Octokit,
  OctokitOptions,
  SecretClient,
} from "./.deps.ts";

export const EaCOctokit = Octokit; //.plugin(paginateGraphql);

/** Load octokit instance from a token. */
export async function loadOctokit(token: string): Promise<Octokit>;

/** Load octokit instance from provider and source details. */
export async function loadOctokit(
  providerDetails: EaCGitHubAppProviderDetails,
  sourceDetails: EaCSourceConnectionDetails,
): Promise<Octokit>;

/** Load octokit instance from provider details, GitHub app and source details. */
export async function loadOctokit(
  providerDetails: EaCGitHubAppProviderDetails,
  gitHubAppDetails: EaCGitHubAppDetails,
  sourceDetails: EaCSourceConnectionDetails,
): Promise<Octokit>;

/** Load octokit instance from provider details, EaC, GitHub app and source details. */
export async function loadOctokit(
  providerDetails: EaCGitHubAppProviderDetails,
  eac: EverythingAsCodeClouds,
  gitHubApp: EaCGitHubAppAsCode,
  sourceDetails?: EaCSourceConnectionDetails,
): Promise<Octokit>;

/** Load octokit instance. */
export async function loadOctokit(
  tokenProviderDetails: EaCGitHubAppProviderDetails | string,
  detailsEaC?:
    | EaCSourceConnectionDetails
    | EaCGitHubAppDetails
    | EverythingAsCodeClouds,
  sourceDetailsGitHubApp?: EaCSourceConnectionDetails | EaCGitHubAppAsCode,
  sourceDetails?: EaCSourceConnectionDetails,
): Promise<Octokit> {
  const octokitConfig: OctokitOptions = {};

  let secretClientLoader: Promise<SecretClient> | undefined = undefined;

  if (isEaCGitHubAppProviderDetails(tokenProviderDetails)) {
    if (
      isEverythingAsCodeClouds(detailsEaC) &&
      isEaCGitHubAppAsCode(sourceDetailsGitHubApp)
    ) {
      const cloudLookup = sourceDetailsGitHubApp.CloudLookup!;

      const keyVaultLookup = sourceDetailsGitHubApp.KeyVaultLookup!;

      secretClientLoader = loadSecretClient(
        detailsEaC,
        cloudLookup,
        keyVaultLookup,
      );

      detailsEaC = sourceDetailsGitHubApp!.Details as EaCGitHubAppDetails;
    } else if (isEaCGitHubAppDetails(detailsEaC)) {
      secretClientLoader = loadMainSecretClient();

      sourceDetails = sourceDetailsGitHubApp as EaCSourceConnectionDetails;
    }

    if (isEaCSourceConnectionDetails(detailsEaC)) {
      octokitConfig.authStrategy = createOAuthUserAuth;

      octokitConfig.auth = {
        clientId: tokenProviderDetails.ClientID!,
        clientSecret: tokenProviderDetails.ClientSecret!,
        clientType: "oauth-app",
        token: detailsEaC.Token,
      };
    } else if (isEaCGitHubAppDetails(detailsEaC)) {
      octokitConfig.authStrategy = createAppAuth;

      let privateKey = tokenProviderDetails.PrivateKey;

      if (privateKey.startsWith("$secret:")) {
        const secretClient = await secretClientLoader!;

        const privateKeySecret = await secretClient.getSecret(
          privateKey.replace("$secret:", ""),
        );

        privateKey = privateKeySecret.value!;
      }

      octokitConfig.auth = {
        appId: tokenProviderDetails.AppID,
        privateKey: privateKey,
        clientId: tokenProviderDetails.ClientID,
        clientSecret: tokenProviderDetails.ClientSecret,
      };
    }
  } else {
    octokitConfig.auth = tokenProviderDetails;
  }

  let octokit = new EaCOctokit(octokitConfig);

  if (sourceDetails) {
    octokit = (await octokit.auth({
      type: "oauth-user",
      token: sourceDetails.Token,
      factory: (options: unknown) => {
        return new Octokit({
          authStrategy: createOAuthUserAuth,
          auth: options,
        });
      },
    })) as Octokit;
  }

  return octokit;
}

// export function loadMainOctokit(): Promise<Octokit>;

// export function loadMainOctokit(
//   sourceDetails: EaCSourceConnectionDetails,
// ): Promise<Octokit>;

// export function loadMainOctokit(
//   sourceDetails?: EaCSourceConnectionDetails,
// ): Promise<Octokit> {
//   const appDetails = loadMainGitHubAppDetails();

//   console.log(appDetails);

//   return loadOctokit(appDetails, sourceDetails);
// }

// export function loadMainGitHubAppDetails(): EaCGitHubAppDetails {
//   return {
//     AppID: Deno.env.get("GITHUB_APP_ID")!,
//     ClientID: Deno.env.get("GITHUB_CLIENT_ID")!,
//     ClientSecret: Deno.env.get("GITHUB_CLIENT_SECRET")!,
//     PrivateKey: Deno.env.get("GITHUB_PRIVATE_KEY")!,
//     WebhooksSecret: Deno.env.get("GITHUB_WEBHOOKS_SECRET")!,
//   };
// }
