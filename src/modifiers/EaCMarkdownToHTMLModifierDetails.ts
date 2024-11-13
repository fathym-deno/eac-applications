import {
  EaCModifierDetails,
  isEaCModifierDetails,
} from "./EaCModifierDetails.ts";

/**
 * The details of a Markdown to HTML modifier.
 */
export type EaCMarkdownToHTMLModifierDetails = EaCModifierDetails<
  "MarkdownToHTML"
>;

/**
 * Type Guard: Checks if the given object is an EaCMarkdownToHTML.
 *
 * @param details The details of a Markdown to HTML modifier.
 * @returns true if the object is an EaCMarkdownToHTMLModifierDetails, false otherwise.
 */
export function isEaCMarkdownToHTMLModifierDetails(
  details: unknown,
): details is EaCMarkdownToHTMLModifierDetails {
  const x = details as EaCMarkdownToHTMLModifierDetails;

  return isEaCModifierDetails("MarkdownToHTML", x);
}
