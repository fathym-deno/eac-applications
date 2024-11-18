export type {
  EaCMetadataBase,
  EaCModuleActuator,
  EverythingAsCode,
} from "jsr:@fathym/eac@0.2.14";
export { callEaCActuatorConnections } from "jsr:@fathym/eac@0.2.14/steward/utils";

export {
  type EverythingAsCodeClouds,
  isEverythingAsCodeClouds,
} from "jsr:@fathym/eac-azure@0.0.4";
export {
  loadMainSecretClient,
  loadSecretClient,
} from "jsr:@fathym/eac-azure@0.0.4/utils";

export {
  type EaCGitHubAppAsCode,
  type EaCGitHubAppDetails,
  isEaCGitHubAppAsCode,
  isEaCGitHubAppDetails,
} from "jsr:@fathym/eac-github@0.0.4";

export {
  type EaCGitHubAppProviderDetails,
  isEaCGitHubAppProviderDetails,
} from "jsr:@fathym/eac-identity@0.0.4";

export {
  type EaCSourceConnectionDetails,
  type EaCSourceDetails,
  isEaCSourceConnectionDetails,
} from "jsr:@fathym/eac-sources@0.0.3";

export { Octokit } from "npm:octokit@4.0.2";
export { type OctokitOptions } from "npm:@octokit/core@6.1.2";

export {
  createAppAuth,
  createOAuthUserAuth,
} from "npm:@octokit/auth-app@6.0.1";

export { SecretClient } from "npm:@azure/keyvault-secrets@4.8.0";
