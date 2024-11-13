import {
  EaCModifierDetails,
  isEaCModifierDetails,
} from "./EaCModifierDetails.ts";

/**
 * The tracing modifier details.
 */
export type EaCTracingModifierDetails = {
  /** Whether to trace the request. */
  TraceRequest: boolean;

  /** Whether to trace the response. */
  TraceResponse: boolean;
} & EaCModifierDetails<"Tracing">;

/**
 * Type Guard: Checks if the given object is an EaCTracingModifierDetails.
 *
 * @param details The tracing modifier details.
 * @returns true if the given details are tracing modifier details, false otherwise.
 */
export function isEaCTracingModifierDetails(
  details: unknown,
): details is EaCTracingModifierDetails {
  const x = details as EaCTracingModifierDetails;

  return (
    isEaCModifierDetails("Tracing", x) &&
    x.TraceRequest !== undefined &&
    typeof x.TraceRequest === "boolean" &&
    x.TraceResponse !== undefined &&
    typeof x.TraceResponse === "boolean"
  );
}
