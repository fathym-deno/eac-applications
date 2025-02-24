export * from "./azure/.exports.ts";

import FtmCrPlgn from "./FathymCorePlugin.ts";
export const FathymCorePlugin = FtmCrPlgn;

import FDFHP from "./FathymDFSFileHandlerPlugin.ts";
export const FathymDFSFileHandlerPlugin = FDFHP;

import FEP from "./FathymEaCPlugin.ts";
export const FathymEaCPlugin = FEP;

import FEAP from "./FathymEaCApplicationsPlugin.ts";
export const FathymEaCApplicationsPlugin = FEAP;

import FEDKVP from "./FathymEaCDenoKVPlugin.ts";
export const FathymEaCDenoKVPlugin = FEDKVP;

import FMHP from "./FathymModifierHandlerPlugin.ts";
export const FathymModifierHandlerPlugin = FMHP;

import FPHP from "./FathymProcessorHandlerPlugin.ts";
export const FathymProcessorHandlerPlugin = FPHP;
