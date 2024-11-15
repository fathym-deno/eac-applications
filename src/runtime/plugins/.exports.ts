export * from "./azure/.exports.ts";

import FtmCrPlgn from "./FathymCorePlugin.ts";
export const FathymCorePlugin = FtmCrPlgn;

// import FtmDmPlgn from './FathymDemoPlugin.ts';
// export const FathymDemoPlugin = FtmDmPlgn;

import FtmDFSFlHndlrPlgn from "./FathymDFSFileHandlerPlugin.ts";
export const FathymDFSFileHandlerPlugin = FtmDFSFlHndlrPlgn;

import FtmECPlgn from "./FathymEaCPlugin.ts";
export const FathymEaCPlugin = FtmECPlgn;

import FtmECSvcsPlgn from "./FathymEaCDenoKVPlugin.ts";
export const FathymEaCServicesPlugin = FtmECSvcsPlgn;

import FtmMdfrHndlrPlgn from "./FathymModifierHandlerPlugin.ts";
export const FathymModifierHandlerPlugin = FtmMdfrHndlrPlgn;

import FtmPrcrHndlrPlgn from "./FathymProcessorHandlerPlugin.ts";
export const FathymProcessorHandlerPlugin = FtmPrcrHndlrPlgn;
