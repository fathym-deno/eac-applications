import { EaCRuntimeHandlerSet } from "../../.deps.ts";
import { buildUserEaCMiddleware } from "../../middlewares/buildUserEaCMiddleware.ts";

export default [buildUserEaCMiddleware()] as EaCRuntimeHandlerSet;
