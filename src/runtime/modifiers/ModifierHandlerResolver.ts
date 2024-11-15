import { EaCModifierAsCode, EaCRuntimeHandler, IoCContainer } from "./.deps.ts";

export type ModifierHandlerResolver = {
  Resolve: (
    ioc: IoCContainer,
    modifier: EaCModifierAsCode,
  ) => Promise<EaCRuntimeHandler | undefined>;
};
