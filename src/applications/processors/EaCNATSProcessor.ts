import { EaCProcessor, isEaCProcessor } from "./EaCProcessor.ts";
import { RetentionPolicy, StorageType } from "npm:nats@2.29.2";

/**
 * Configuration for a JetStream stream.
 */
export type JetStreamStreamConfig = {
  /** The name of the stream */
  Name: string;

  /** Subjects that this stream listens to */
  Subjects: string[];

  /** Retention policy (Workqueue, Interest, Limits) */
  Retention?: RetentionPolicy;

  /** Storage type (Memory or File) */
  Storage?: StorageType;

  /** Maximum messages retained (-1 for unlimited) */
  MaxMsgs?: number;

  /** Maximum number of bytes retained (-1 for unlimited) */
  MaxBytes?: number;

  /** Maximum number of consumers (-1 for unlimited) */
  MaxConsumers?: number;

  /** Enable/Disable Acknowledgments */
  NoAck?: boolean;
};

/**
 * The NATS processor.
 */
export type EaCNATSProcessor = {
  /** Additional NATS client options. */
  ClientOptions?: Record<string, unknown>;

  /** The DFS lookup. */
  DFSLookup: string;

  EventRoot: string;

  /** Maximum reconnect attempts if the connection fails. */
  MaxReconnects?: number;

  /** The URL of the NATS server. */
  NATSURL: string;

  /** The reconnect delay in milliseconds. */
  ReconnectDelayMs?: number;

  /** JetStream Configuration (if enabled) */
  JetStream?: {
    /** Whether to enable JetStream (for persistence & stream processing). */
    Enabled: boolean;

    /** JetStream Stream Configurations */
    Streams: JetStreamStreamConfig[];
  };
} & EaCProcessor<"NATS">;

/**
 * Type Guard: Checks if the given object is an EaCNATSProcessor.
 *
 * @param proc The NATS processor.
 * @returns true if the given processor is a NATS processor, false otherwise.
 */
export function isEaCNATSProcessor(proc: unknown): proc is EaCNATSProcessor {
  const x = proc as EaCNATSProcessor;

  return (
    isEaCProcessor("NATS", x) &&
    x.NATSURL !== undefined &&
    typeof x.NATSURL === "string"
  );
}
