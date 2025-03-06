import { EaCProcessor, isEaCProcessor } from "./EaCProcessor.ts";

/**
 * The stripe processor.
 */
export type EaCStripeProcessor = {
  /** The database lookup for the stripe processor. */
  DatabaseLookup: string;

  /** Used to handle when the subscriptin is successful. */
  HandleSubscription: (
    entLookup: string,
    username: string,
    licLookup: string,
    planLookup: string,
    priceLookup: string,
  ) => Promise<unknown>;

  /** The license lookup for the stripe processor. */
  LicenseLookup: string;
} & EaCProcessor<"Stripe">;

/**
 * Type Guard: Checks if the given object is an EaCStripeProcessor.
 *
 * @param proc The stripe processor.
 * @returns true if the given processor is a stripe processor, false otherwise.
 */
export function isEaCStripeProcessor(
  proc: unknown,
): proc is EaCStripeProcessor {
  const x = proc as EaCStripeProcessor;

  return (
    isEaCProcessor("Stripe", x) &&
    x.DatabaseLookup !== undefined &&
    typeof x.DatabaseLookup === "string" &&
    x.LicenseLookup !== undefined &&
    typeof x.LicenseLookup === "string"
  );
}
