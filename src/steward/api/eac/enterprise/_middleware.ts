import { EaCRuntimeHandlerSet } from "../../.deps.ts";
import { userEaCMiddleware } from "../../middlewares/userEaCMiddleware.ts";

export default [userEaCMiddleware] as EaCRuntimeHandlerSet;
