import { EaCProcessor } from "./EaCProcessor.ts";

/**
 * Shared base for event-driven processors like NATS and Event Hub.
 */
export type BaseEaCMessagingProcessor<TType extends string> = {
  /** The DFS lookup for loading dynamic handlers. */
  DFSLookup: string;

  /** The root event path used for message subscription and routing. */
  EventRoot: string;
} & EaCProcessor<TType>;
