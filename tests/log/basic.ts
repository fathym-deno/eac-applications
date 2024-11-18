import { EaCApplicationsLoggingProvider } from "../../src/runtime/logging/EaCApplicationsLoggingProvider.ts";

Deno.test("EaC Logging", async (t) => {
  const logging = new EaCApplicationsLoggingProvider();

  await t.step("Package Logger", () => {
    const logger = logging.Package;
    logger.debug("This is a debug message");
    logger.info("This is an info message");
    logger.warn("This is a warning message");
    logger.error("This is an error message");
    logger.critical("This is a critical message");
  });

  await t.step("Package Logger - Named", () => {
    const logger = logging.Default;
    logger.debug("This is a default debug message");
    logger.info("This is a default info message");
    logger.warn("This is a default warning message");
    logger.error("This is a default error message");
    logger.critical("This is a default critical message");
  });

  await t.step("Package Logger - Named - EaC", () => {
    const logger = logging.LoggerSync("@fathym/eac");
    logger.debug("This is a EaC debug message");
    logger.info("This is a EaC info message");
    logger.warn("This is a EaC warning message");
    logger.error("This is a EaC error message");
    logger.critical("This is a EaC critical message");
  });

  await t.step("Package Logger - Named - Not Configed", () => {
    const logger = logging.LoggerSync("blah");
    logger.debug("THIS SHOULD NOT SHOW");
    logger.info("THIS SHOULD NOT SHOW");
    logger.warn("THIS SHOULD NOT SHOW");
    logger.error("THIS SHOULD NOT SHOW");
    logger.critical("THIS SHOULD NOT SHOW");
  });
});
