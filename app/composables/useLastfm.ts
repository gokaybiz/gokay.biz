/* *
 * DEPRECATED: We are moved to server side API calls
 * */

import {
  Effect,
  Context,
  Layer,
  Option,
  pipe,
  Schedule,
  Duration,
} from "effect";
import { useRuntimeConfig } from "#app";

// ------------------------------
// Types
// ------------------------------

export interface Track {
  name: string;
  artist: { name: string };
  playcount?: number;
  image: Array<{ size: string; "#text": string }>;
  date?: { uts: string };
}

export class FetchError {
  readonly _tag = "FetchError";
  constructor(
    readonly error: unknown,
    readonly url?: string,
  ) {}
}

export class ApiError {
  readonly _tag = "ApiError";
  constructor(
    readonly message: string,
    readonly status?: number,
  ) {}
}

export type RecentTrackData = {
  name: string;
  artist: string;
  playCount: number;
};

// ------------------------------
// Service Definition
// ------------------------------

export interface LastfmConfig {
  readonly apiKey: string;
  readonly user: string;
}

// Create a service interface tag
export class LastfmService extends Context.Tag("LastfmService")<
  LastfmService,
  {
    getRecentTracks: (
      limit?: number,
    ) => Effect.Effect<Track[], FetchError | ApiError>;
    getTopTracks: (
      period?: string,
      limit?: number,
    ) => Effect.Effect<Track[], FetchError | ApiError>;
    getListeningData: () => Effect.Effect<
      {
        recentTracks: Track[];
        frequentRecent: RecentTrackData[];
        topMonthly: Track[];
      },
      FetchError | ApiError
    >;
  }
>() {}

// ------------------------------
// Internal helpers
// ------------------------------

const BASE_URL = "https://ws.audioscrobbler.com/2.0/";

const buildUrl = (
  method: string,
  params: Record<string, string | number>,
  apiKey: string,
): string =>
  `${BASE_URL}?${new URLSearchParams({
    method,
    api_key: apiKey,
    format: "json",
    ...params,
  }).toString()}`;

const fetchJson = <T>(url: string): Effect.Effect<T, FetchError | ApiError> =>
  Effect.tryPromise({
    try: () => fetch(url),
    catch: (e) => new FetchError(e, url),
  }).pipe(
    Effect.flatMap((response: Response) =>
      Effect.if(response.ok, {
        onTrue: () =>
          Effect.tryPromise({
            try: () => response.json() as Promise<T>,
            catch: (e) => new FetchError(e, url),
          }),
        onFalse: () =>
          Effect.fail(
            new ApiError(`HTTP Error ${response.status}`, response.status),
          ),
      }),
    ),
    Effect.retry(
      Schedule.exponential("500 millis").pipe(
        Schedule.union(Schedule.recurs(3)),
      ),
    ),
  );

// ------------------------------
// --- Helpers ---
// ------------------------------

const parseRecentTracks = (tracks: Track[], since: number): RecentTrackData[] =>
  Object.entries(
    tracks
      .filter((track) =>
        pipe(
          Option.fromNullable(track.date?.uts),
          Option.map((uts: string) => Number.parseInt(uts, 10) * 1000 > since),
          Option.getOrElse(() => false),
        ),
      )
      .reduce<Record<string, number>>((acc, track) => {
        const key = `${track.name}-${track.artist.name}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
  )
    .map(([key, count]) => {
      const [name, artist] = key.split("-", 2);
      return name && artist ? { name, artist, playCount: count } : null;
    })
    .filter((x): x is RecentTrackData => x !== null)
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, 10);

// ------------------------------
// Service Implementation
// ------------------------------

export const createLastfmService = ({ apiKey, user }: LastfmConfig) => {
  const getRecentTracks = (limit = 50) =>
    fetchJson<{ recenttracks: { track: Track[] } }>(
      buildUrl(
        "user.getrecenttracks",
        { user, limit: limit.toString(), extended: "1" },
        apiKey,
      ),
    ).pipe(
      Effect.map((res) => res.recenttracks.track),
      Effect.catchTag("ApiError", (error) =>
        Effect.fail(
          new ApiError(
            `Failed to fetch recent tracks: ${error.message}`,
            error.status,
          ),
        ),
      ),
    );

  const getTopTracks = (period = "1month", limit = 10) =>
    fetchJson<{ toptracks: { track: Track[] } }>(
      buildUrl(
        "user.gettoptracks",
        { user, period, limit: limit.toString() },
        apiKey,
      ),
    ).pipe(
      Effect.map((res) => res.toptracks.track),
      Effect.catchTag("ApiError", (error) =>
        Effect.fail(
          new ApiError(
            `Failed to fetch top tracks: ${error.message}`,
            error.status,
          ),
        ),
      ),
    );

  const getListeningData = () =>
    Effect.all([getRecentTracks(50), getTopTracks("1month", 10)], {
      concurrency: "unbounded",
    }).pipe(
      Effect.map(([recentTracks, topMonthly]) => {
        const threeDaysAgo = Date.now() - Duration.toMillis(Duration.days(3));
        return {
          recentTracks: recentTracks
            .filter((track) => track.date?.uts !== undefined)
            .slice(0, 15),
          frequentRecent: parseRecentTracks(recentTracks, threeDaysAgo),
          topMonthly,
        };
      }),
    );

  return { getRecentTracks, getTopTracks, getListeningData };
};

// ------------------------------
// Layer Implementation
// ------------------------------

export const LastfmLayer = (params?: { apiKey?: string; user?: string }) => {
  const config: LastfmConfig = {
    apiKey: params?.apiKey ?? process.env.NUXT_PUBLIC_LASTFM_API_KEY ?? "",
    user:
      params?.user ??
      (typeof useRuntimeConfig === "function"
        ? (useRuntimeConfig().public.lastfmUser as string)
        : ""),
  };
  return Layer.effect(
    LastfmService,
    Effect.succeed(createLastfmService(config)),
  );
};

// ------------------------------
// Nuxt Composable
// ------------------------------

export function useLastfm(config?: { apiKey?: string; user?: string }) {
  const layer = LastfmLayer(config);
  return Effect.runPromise(
    LastfmService.pipe(
      Effect.flatMap((service) => service.getListeningData()),
      Effect.withRequestCaching(true),
      Effect.catchAll(() =>
        Effect.succeed({
          recentTracks: [] as Track[],
          frequentRecent: [] as RecentTrackData[],
          topMonthly: [] as Track[],
        }),
      ),
      Effect.provide(layer),
    ),
  );
}
