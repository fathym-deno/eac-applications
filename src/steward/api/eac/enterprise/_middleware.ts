import { EaCRuntimeHandlerSet } from "../../.deps.ts";
import { buildUserEaCStewardMiddleware } from "../../middlewares/buildUserEaCStewardMiddleware.ts";

export default [buildUserEaCStewardMiddleware()] as EaCRuntimeHandlerSet;
