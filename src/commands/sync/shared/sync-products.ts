import fs from "fs";
import path from "path";
import { SynchronizationStep } from "../../../util/synchronization-step";
import { getEnvDirectory, logger } from "../../../util/utils";
import { SharedSyncData } from "../sync-command";
import { OneCXValuesSpecification } from "../types";

export interface SyncProductsParams extends SharedSyncData {
  icon: string;
  basePath: string;
}

export class SyncProducts implements SynchronizationStep<SyncProductsParams> {
  synchronize(
    _: OneCXValuesSpecification,
    { env, dry, ...params }: SyncProductsParams
  ): void {
    const importsDir = getEnvDirectory(
      "./imports/product-store/products/",
      env
    );

    // Target file
    const filePath = path.resolve(importsDir, `${params.productName}.json`);

    // Product JSON
    const product = {
      version: "xxx",
      description: params.productName.replace(/-/g, " "),
      basePath: params.basePath,
      displayName: params.productName.replace(/-/g, " "),
      iconName: params.icon,
    };

    if (dry) {
      logger.info(
        `Dry Run: Would write to ${filePath} with content:`,
        JSON.stringify(product, null, 2)
      );
    } else {
      fs.writeFileSync(filePath, JSON.stringify(product, null, 2));
    }

    logger.info("Product synchronized successfully.");
  }

  checkProductInUse(productName: string, env: string): boolean {
    const importsDir = getEnvDirectory("./imports/", env);

    /**
     * For microservices, permissions, microfrontends and slots we can check if a file exist
     * where the productName is the prefix of the file name. We though need to ignore the product
     * file itself, where the name is the full file name.
     */

    const files = fs.readdirSync(importsDir);
    const existingFile = files.find(
      (file) => file.startsWith(productName) && file !== `${productName}.json`
    );
    if (existingFile) {
      logger.info(
        `Product ${productName} is still in use by file ${existingFile}, skipping removal.`
      );
      return true;
    }

    /**
     * For assignments
     */
    const assignmentsDir = getEnvDirectory("./imports/assignments", env);
    const assignmentsFilePath = path.join(assignmentsDir, "onecx.json");

    if (!fs.existsSync(assignmentsFilePath)) {
      throw new Error(
        `Assignments file not found at path: ${assignmentsFilePath}`
      );
    }

    const assignmentsFile = fs.readFileSync(assignmentsFilePath, "utf8");
    const assignments = JSON.parse(assignmentsFile);

    // Section for product in assignments
    if (assignments.assignments[productName] !== undefined) {
      logger.info(
        `Product ${productName} is still in use by assignments, skipping removal.`
      );
      return true;
    }

    return false;
  }

  removeSynchronization(
    _: OneCXValuesSpecification,
    { env, dry, ...params }: SyncProductsParams
  ): void {
    const inUse = this.checkProductInUse(params.productName, env);
    if (inUse) {
      return;
    }
    const importsDir = getEnvDirectory(
      "./imports/product-store/products/",
      env
    );

    const filePath = path.resolve(importsDir, `${params.productName}.json`);

    if (dry) {
      logger.info(`Dry Run: Would remove file at ${filePath}`);
    } else {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info("Product file removed successfully.");
      }
    }
  }
}
