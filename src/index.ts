#! /usr/bin/env node

import { Argument, Command } from "commander"; // add this line

import { RemoveSyncSVCCommand } from "./commands/sync/svc/remove-sync-svc";
import { SyncSVCCommand } from "./commands/sync/svc/sync-svc";
import { RemoveSyncUICommand } from "./commands/sync/ui/remove-sync-ui";
import { SyncUICommand } from "./commands/sync/ui/sync-ui";
import * as colors from "colors/safe";
import { logger } from "./util/utils";
import { RemoveSyncBFFCommand } from "./commands/sync/bff/remove-sync-bff";
import { SyncBFFCommand } from "./commands/sync/bff/sync-bff";
import { ManageMenuEntryCommand } from "./commands/menu/menu-entry";

//add the following line
const program = new Command();
const cli = program
  .version("1.0.0")
  .description(
    "The onecx-local-env CLI helps to work with the local environment"
  );

cli
  .command("sync")
  .addArgument(
    new Argument("<type>", "type of microservice").choices(["ui", "bff", "svc"])
  )
  .argument("<productName>", "The name of the product")
  .argument("<basePath>", "The base path of the product")
  .argument(
    "<pathToValues>",
    "The path to the values.yaml file of the microservice"
  )
  .option("-e, --env <path>", "Path to the local environment", "./")
  .option(
    "-n, --name <name>",
    "Custom name for the UI, if repository should not be used"
  )
  .option("-r, --role <role>", "Role name for the assignments", "onecx-admin")
  .option("-i, --icon <iconName>", "The icon of the product", "pi-briefcase")
  .option("-d, --dry", "If should do a dry run", false)
  .option("-R, --remove", "If synchronization should be removed", false)
  .option("-v, --verbose", "Print verbose information", false)
  .action((type, productName, basePath, pathToValues, options) => {
    if (options.verbose) {
      process.env.VERBOSE = "true";
    }
    try {
      logger.verbose(
        `Running sync command with options: ${JSON.stringify(options)}`
      );
      logger.verbose(`Product name: ${productName}`);
      logger.verbose(`Base path: ${basePath}`);
      logger.verbose(`Path to values: ${pathToValues}`);
      getCommandForType(type, options.remove).run(
        {
          pathToValues,
          productName,
          basePath,
        },
        options
      );
    } catch (error: any) {
      logger.error(error.message);
    }
  });

cli
  .command("menu")
  .addArgument(
    new Argument("<operation>", "operation to do").choices(["create", "remove"])
  )
  .argument("<appId>", "The application id to link to (unique for entry)")
  .argument("[url]", "The URL of the menu entry")
  .argument("[name]", "The name of the menu entry")
  .option("-e, --env <path>", "Path to the local environment", "./")
  .option("-b, --badge <iconName>", "The badge of the menu entry", "briefcase")
  .option("-d, --dry", "If should do a dry run", false)
  .option("-v, --verbose", "Print verbose information", false)
  .action((operation, appId, url, name, options) => {
    if (options.verbose) {
      process.env.VERBOSE = "true";
    }
    try {
      logger.verbose(
        `Running menu command with options: ${JSON.stringify(options)}`
      );
      url = url ?? `/${appId.toLowerCase().replace(" ", "-")}`;
      name = name ?? appId.replace("-", " ");
      logger.verbose(`Operation: ${operation}`);
      logger.verbose(`URL: ${url}`);
      logger.verbose(`Name: ${name}`);
      logger.verbose(`App ID: ${appId}`);

      new ManageMenuEntryCommand().run(
        {
          operation,
          appId,
          url,
          name,
          badge: options.badge,
        },
        options
      );
    } catch (error: any) {
      logger.error(error.message);
    }
  });

cli.parse(process.argv, {
  from: "node",
});

function getCommandForType(
  type: "ui" | "bff" | "svc",
  removal: boolean = false
) {
  switch (type) {
    case "ui":
      return removal ? new RemoveSyncUICommand() : new SyncUICommand();
    case "bff":
      return removal ? new RemoveSyncBFFCommand() : new SyncBFFCommand();
    case "svc":
      return removal ? new RemoveSyncSVCCommand() : new SyncSVCCommand();
    default:
      throw new Error(`Unknown type: ${type}`);
  }
}
