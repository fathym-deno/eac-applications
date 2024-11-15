import {
  EaCModifierDetails,
  isEaCModifierDetails,
} from "./EaCModifierDetails.ts";

/**
 * The EaCOAuth modifier details.
 */
export type EaCOAuthModifierDetails = {
  /** The provider lookup for the OAuth provider. */
  ProviderLookup: string;

  /** The sign-in path for the OAuth provider. */
  SignInPath: string;
} & EaCModifierDetails<"OAuth">;

/**
 * Type Guard: Checks if the given object is an EaCOAuthModifierDetails.
 *
 * @param details The details of the EaCOAuth modifier.
 * @returns true if the given details are an EaCOAuthModifierDetails, false otherwise.
 */
export function isEaCOAuthModifierDetails(
  details: unknown,
): details is EaCOAuthModifierDetails {
  const x = details as EaCOAuthModifierDetails;

  return (
    isEaCModifierDetails("OAuth", x) &&
    x.ProviderLookup !== undefined &&
    typeof x.ProviderLookup === "string" &&
    x.SignInPath !== undefined &&
    typeof x.SignInPath === "string"
  );
}
