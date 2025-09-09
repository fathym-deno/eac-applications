/**
 * The EaC Application Resolver Configuration.
 */
export type EaCApplicationResolverConfiguration = {
  /** The allowed HTTP methods for the resolver. */
  AllowedMethods?: string[];

  /** The access right lookups required for the resolver. */
  AccessRightLookups?: string[];

  /**
   * Whether to match any of the required access rights (true) or require all (false/undefined).
   *
   * - true  => at least one of `AccessRightLookups` must be present
   * - false => all `AccessRightLookups` must be present
   */
  IsAnyAccessMatch?: boolean;

  /** Whether the resolver is private. */
  IsPrivate?: boolean;

  /** Whether the resolver should trigger the sign-in flow. */
  IsTriggerSignIn?: boolean;

  /** The path pattern for the resolver. */
  PathPattern: string;

  /** The resolver's priority. */
  Priority: number;

  /** The regular expression for matching user agents. */
  UserAgentRegex?: string;
};
