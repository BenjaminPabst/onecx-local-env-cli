import { logger } from "../../../util/utils";
import { SyncMicroservices } from "../shared/sync-microservices";
import { SyncPermissions } from "../shared/sync-permissions";
import { SyncProducts } from "../shared/sync-products";
import { retrieveValuesYAML } from "../shared/values.utils";
import { SharedSyncData, SyncCommand } from "../sync-command";
import { OneCXValuesSpecification } from "../types";

export interface SyncBFFData extends SharedSyncData {
  productName: string;
  pathToValues: string;
  basePath: string;
}

export class SyncBFFCommand implements SyncCommand<SyncBFFData> {
  run(data: SyncBFFData): void {
    retrieveValuesYAML(data.pathToValues, data.onecxSectionPath)
      .then((values) => {
        this.performSync(data, values as OneCXValuesSpecification);
      })
      .catch((r) => {
        logger.error(r.message);
      });
  }

  performSync(data: SyncBFFData, values: OneCXValuesSpecification) {
    logger.info("Syncing BFF...");

    // Check if repository is provided or custom name is provided
    if (!values.image.repository && !data.name) {
      throw new Error(
        "No repository found in values file and no custom name provided."
      );
    }
    let bffName = data.name ?? "";
    if (values.image.repository) {
      bffName = values.image.repository.split("/").pop() ?? "";
    }

    // Permissions
    new SyncPermissions().synchronize(values, {
      ...data,
      appName: bffName,
      roleName: data.role,
    });
    // Microservices
    new SyncMicroservices().synchronize(values, {
      ...data,
      customName: bffName,
      type: "bff",
    });
    // Products
    new SyncProducts().synchronize(values, {
      ...data,
      icon: data.icon,
    });

    logger.info("BFF synchronized successfully.");
  }
}
