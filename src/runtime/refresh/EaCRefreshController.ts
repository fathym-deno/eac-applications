import type { EaCRuntimeConfig } from "../plugins/.deps.ts";
import { LoggingProvider } from "../_/.deps.ts";
import type { EverythingAsCode } from "../plugins/.deps.ts";
import { EaCSource } from "./EaCSource.ts";
import { RuntimeBuilder } from "./RuntimeBuilder.ts";
import { RuntimeHost } from "./RuntimeHost.ts";

export type RefreshResult = {
  swapped: boolean;
  previousHash?: string;
  newHash?: string;
  revision?: string;
  routeGroups?: number;
  enterprise?: string;
  message?: string;
};

export class EaCRefreshController {
  protected lastHash?: string;

  protected refreshing = false;

  protected lastSwappedAt?: number;

  protected cooldownMs: number;

  protected polling = false;

  protected pollTimer?: number;

  protected pollIntervalMs?: number;

  protected pollJitterPct?: number;

  protected lastPollAt?: number;

  protected pollCount = 0;

  constructor(
    protected config: EaCRuntimeConfig,
    protected source: EaCSource,
    protected builder: RuntimeBuilder,
    protected host: RuntimeHost,
    protected logging: LoggingProvider,
  ) {
    const envCooldown = Deno.env.get("EAC_REFRESH_COOLDOWN_MS");
    this.cooldownMs = envCooldown ? Number(envCooldown) : 0;
  }

  public GetStatus() {
    return {
      lastHash: this.lastHash,
      lastSwappedAt: this.lastSwappedAt,
      refreshing: this.refreshing,
      cooldownMs: this.cooldownMs,
      polling: this.polling,
      pollIntervalMs: this.pollIntervalMs,
      pollJitterPct: this.pollJitterPct,
      lastPollAt: this.lastPollAt,
      pollCount: this.pollCount,
    } as const;
  }

  public async RefreshNow(force = false): Promise<RefreshResult> {
    if (this.refreshing) {
      return { swapped: false, message: "Refresh already in progress" };
    }

    this.refreshing = true;
    try {
      const logger = (await this.config.LoggingProvider).Package;

      // Cooldown check
      if (!force && this.cooldownMs > 0 && this.lastSwappedAt) {
        const since = Date.now() - this.lastSwappedAt;
        if (since < this.cooldownMs) {
          const waitMs = this.cooldownMs - since;
          logger.debug(
            `Refresh within cooldown; ${waitMs}ms remaining. Skipping.`,
          );
          return {
            swapped: false,
            previousHash: this.lastHash,
            newHash: this.lastHash,
            message: `Cooldown active; try again in ${waitMs}ms`,
          };
        }
      }

      const fetched = await this.source.FetchFromEnv();

      if (!fetched) {
        return { swapped: false, message: "EaC source not configured" };
      }

      const { eac, hash, enterprise } = fetched;

      const previousHash = this.lastHash;

      if (!force && previousHash && previousHash === hash) {
        logger.debug("EaC unchanged; skipping rebuild.");
        return {
          swapped: false,
          previousHash,
          newHash: hash,
          enterprise,
          message: "No changes detected",
        };
      }

      logger.debug("Building runtime for refreshed EaC...");

      const { routes, revision } = await this.builder.Build(
        eac as EverythingAsCode,
      );

      this.host.SetRoutes(routes, revision || hash);

      this.lastHash = hash;
      this.lastSwappedAt = Date.now();

      logger.debug("Runtime swap completed.");

      return {
        swapped: true,
        previousHash,
        newHash: hash,
        revision: revision || hash,
        routeGroups: routes?.length || 0,
        enterprise,
      };
    } finally {
      this.refreshing = false;
    }
  }

  protected scheduleNextPoll() {
    if (!this.polling || !this.pollIntervalMs) return;

    const base = this.pollIntervalMs;
    const jitter = Math.max(0, this.pollJitterPct || 0);
    const delta = jitter > 0 ? (Math.random() * 2 - 1) * jitter : 0; // [-jitter, +jitter]
    const delay = Math.max(250, Math.floor(base * (1 + delta)));

    this.pollTimer = setTimeout(async () => {
      try {
        this.lastPollAt = Date.now();
        this.pollCount += 1;
        await this.RefreshNow(false);
      } catch (_e) {
        // Swallow; next schedule still proceeds
      } finally {
        // Recur if still polling
        if (this.polling) {
          this.scheduleNextPoll();
        }
      }
    }, delay) as unknown as number;
  }

  public StartPolling(intervalMs?: number, jitterPct?: number) {
    const logger = this.logging?.Package ?? console;

    const interval = intervalMs ??
      Number(Deno.env.get("EAC_REFRESH_POLL_INTERVAL_MS") || "0");
    const jitter = jitterPct ??
      Number(Deno.env.get("EAC_REFRESH_POLL_JITTER_PCT") || "0.2");

    if (!interval || interval <= 0) {
      return false;
    }

    if (this.polling) {
      return true;
    }

    this.polling = true;
    this.pollIntervalMs = interval;
    this.pollJitterPct = isNaN(jitter) ? 0 : Math.max(0, Math.min(0.9, jitter));

    logger.debug(
      `Starting EaC refresh polling every ${interval}ms (jitter=${this.pollJitterPct})...`,
    );

    // Kick an immediate refresh attempt, then schedule next
    // Do not await; let it run in background
    this.RefreshNow(false).finally(() => this.scheduleNextPoll());

    return true;
  }

  public AutoStartFromEnv() {
    return this.StartPolling();
  }

  public StopPolling() {
    if (!this.polling) return false;
    this.polling = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = undefined;
    }
    return true;
  }
}
