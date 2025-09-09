/**
 * The EaC Application Resolver Configuration.
 */
export type EaCApplicationResolverConfiguration = {
  /** The allowed HTTP methods for the resolver. */
  AllowedMethods?: string[];

  /** The access right lookups required for the resolver. */
  AccessRightLookups?: string[];

  /**
   * Match mode for required access rights. If omitted, falls back to
   * IsAnyAccessRight when evaluating.
   *
   * 'Any' => at least one of the required rights is present.
   * 'All' => all required rights must be present.
   */
  AccessRightMatch?: "Any" | "All";

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
