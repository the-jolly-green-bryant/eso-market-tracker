import { beforeEach, describe, expect, it, vi } from "vitest";
import * as sampleResults from "../docs/sample.json";
import * as index from "./index";
import {
  collectObservations,
  dateChangedObservations,
  getUtcDate,
  readAppResponse,
  toSegmentRecord,
} from "./index";
import { db, segments } from "@eso-market-tracker/database";

describe("observations-from-tsc-web-app", async () => {
  vi.spyOn(index, "getAppData").mockResolvedValue(sampleResults);
  const writeToFile = vi.spyOn(db, "writeToFile");
  const writeObservationSegments = vi.spyOn(
    segments,
    "writeObservationSegments",
  );

  beforeEach(() => {
    writeToFile.mockReset().mockResolvedValue(false);
    writeObservationSegments.mockReset().mockResolvedValue([]);
  });

  it("returns nothing and writes no fresh observations when prices are unchanged", async () => {
    await expect(collectObservations()).resolves.toEqual([]);
    expect(writeObservationSegments).toHaveBeenCalledTimes(1);
  }, 30_000);

  it("writes a fresh observation only for an updated price", async () => {
    writeToFile.mockResolvedValueOnce(true);

    await expect(collectObservations()).resolves.toHaveLength(1);
    expect(writeObservationSegments).toHaveBeenCalledTimes(2);
    expect(writeToFile).toHaveBeenLastCalledWith(
      expect.objectContaining({ date: getUtcDate() }),
      expect.stringContaining(`/${getUtcDate().replaceAll("-", "/")}`),
    );
  }, 30_000);

  it("dates only changed prices with today's UTC date", () => {
    const observations = [
      {
        item: { id: 1 },
        stats: { average: 100, date: "2026-08-10" },
      },
      {
        item: { id: 2 },
        stats: { average: 200, date: "2026-08-10" },
      },
    ] as Parameters<typeof dateChangedObservations>[0];

    expect(
      dateChangedObservations(observations, [false, true], "2026-08-24"),
    ).toEqual([
      {
        item: { id: 2 },
        stats: { average: 200, date: "2026-08-24" },
      },
    ]);
  });

  it("uses the UTC calendar date", () => {
    expect(getUtcDate(new Date("2026-08-24T23:59:59-07:00"))).toBe(
      "2026-08-25",
    );
  });

  it("preserves numeric traits in segment records", () => {
    const observation = {
      item: { id: 1, trait: 3, quality: 5 },
      stats: { average: 100, date: "2026-08-24" },
    } as Parameters<typeof toSegmentRecord>[0];

    expect(toSegmentRecord(observation)).toEqual(
      expect.objectContaining({ traitId: 3 }),
    );
  });

  it("reads successful AppSheet responses", async () => {
    const response = {
      ok: true,
      json: vi.fn().mockResolvedValue(sampleResults),
    } as unknown as Response;

    await expect(readAppResponse(response)).resolves.toBe(sampleResults);
  });

  it("rejects failed AppSheet responses", async () => {
    const response = {
      ok: false,
      status: 503,
      statusText: "Unavailable",
    } as Response;

    await expect(readAppResponse(response)).rejects.toThrow(
      "Request failed: 503 Unavailable",
    );
  });
});
