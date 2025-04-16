import { BaseEaCMessagingProcessor } from "./BaseEaCMessagingProcessor.ts";
import { isEaCProcessor } from "./EaCProcessor.ts";

/**
 * Azure Event Hub processor config.
 */
export type EaCAzureEventHubProcessor = {
  /** Azure Event Hub connection string. */
  ConnectionString: string;

  /** Event Hub name to consume from. */
  EventHubName: string;

  /** Optional consumer group (defaults to "$Default"). */
  ConsumerGroup?: string;
} & BaseEaCMessagingProcessor<"EVENTHUB">;

/**
 * Type guard to detect an Event Hub processor.
 */
export function isEaCAzureEventHubProcessor(
  proc: unknown,
): proc is EaCAzureEventHubProcessor {
  const x = proc as EaCAzureEventHubProcessor;
  return (
    isEaCProcessor("EVENTHUB", x) &&
    typeof x.ConnectionString === "string" &&
    typeof x.EventHubName === "string"
  );
}
