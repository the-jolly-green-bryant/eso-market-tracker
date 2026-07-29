import "dotenv/config";
import { flattenDatabase, buildDatabase } from "@eso-market-tracker/data";
import { processNextPageOfMinedResults } from "@eso-market-tracker/items-from-uesp";
import { CURRENT_MINING_SUMMARY_INDEX } from "./constants";
import { collectObservations as collectWebAppObservations } from "@eso-market-tracker/observations-from-tsc-web-app";
import { collectObservations as collectAddonObservations } from "@eso-market-tracker/observations-from-tsc2";
import { buildShardedLua } from "@eso-market-tracker/eso-addon";
import { updateKeyValues } from "@eso-market-tracker/api";

// We don't need to insert traits because we got those from flattening.
export const _buildStep = async () =>
  buildDatabase({ skipInsertingTraits: true });

export const prepareDatabase = async (itemIds?: number[]) =>
  itemIds?.length
    ? buildDatabase({ skipInsertingTraits: true, itemIds })
    : flattenDatabase().then(() => _buildStep());

/**
 * Pull from the last known mined results page. We're intentionally skipping the
 *  looted item pages because those don't strike as particularly relevant after
 *  the initial import. Items can be created on an ongoing basis without it.
 *
 * @returns {Promise<Awaited<Awaited<unknown>[]>[]>}
 */
export const importItems = async () =>
  Promise.all([
    processNextPageOfMinedResults({
      next: `https://esolog.uesp.net/viewlog.php?start=${CURRENT_MINING_SUMMARY_INDEX}&record=minedItemSummary`,
      items: [],
    }),
  ]);

export const importObservations = async () => {
  const webAppObservationsCollected = collectWebAppObservations();
  const addonObservationsCollection = collectAddonObservations();

  const collected = await Promise.all([
    webAppObservationsCollected,
    addonObservationsCollection,
  ]);
  return [...new Set(collected.flat())];
};

export const buildAddon = async () => buildShardedLua();

export const buildApi = async (options?: {
  maxKeys?: number;
  internalIds?: number[];
  updateSearchIndex?: boolean;
}) => updateKeyValues(options);
