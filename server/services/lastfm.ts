import { Effect, Option, Duration, Schedule } from "effect";

import type {
  LastfmTrack,
  FrequentTrack,
  LastfmResponse,
} from "~/types/lastfm";

// Error classes
class FetchError {
  readonly _tag = "FetchError";
  constructor(
    readonly error: unknown,
    readonly url?: string,
  ) {}
}

class ApiError {
  readonly _tag = "ApiError";
  constructor(
    readonly message: string,
    readonly status?: number,
  ) {}
}

interface LastfmConfig {
  readonly apiKey: string;
  readonly user: string;
}

// Helper functions for Last.fm API
const BASE_URL = "https://ws.audioscrobbler.com/2.0/";

const buildUrl = (
  method: string,
  params: Record<string, string | number>,
  apiKey: string,
): string => {
  const searchParams = new URLSearchParams({
    method,
    api_key: apiKey,
    format: "json",
    ...params,
  });
  return `${BASE_URL}?${searchParams.toString()}`;
};

const fetchJson = <T>(url: string): Effect.Effect<T, FetchError | ApiError> => {
  const fetchEffect = Effect.tryPromise({
    try: () => fetch(url),
    catch: (e) => new FetchError(e, url),
  });

  const handleResponse = (
    response: Response,
  ): Effect.Effect<T, FetchError | ApiError> => {
    if (response.ok) {
      return Effect.tryPromise({
        try: () => response.json() as Promise<T>,
        catch: (e) => new FetchError(e, url),
      });
    }

    return Effect.fail(
      new ApiError(`HTTP Error ${response.status}`, response.status),
    );
  };

  return fetchEffect.pipe(
    Effect.flatMap(handleResponse),
    Effect.tap(() => Effect.log("Request processed")),
    Effect.retry({
      times: 5,
      schedule: Duration.seconds(0.5).pipe(Schedule.exponential),
    }),
    Effect.catchAll((error) => {
      if (error instanceof FetchError) {
        Effect.logError("Fetch error:", error.error);
      } else if (error instanceof ApiError) {
        Effect.logError("API error:", error.message);
      }
      return Effect.fail(error);
    }),
  );
};

// Last.fm API functions
export const createLastfmService = ({ apiKey, user }: LastfmConfig) => {
  const getRecentTracks = (limit = 50) => {
    const url = buildUrl(
      "user.getrecenttracks",
      {
        user,
        limit: limit.toString(),
        extended: "1",
      },
      apiKey,
    );

    return fetchJson<{ recenttracks: { track: LastfmTrack[] } }>(url).pipe(
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
  };

  const getTopTracks = (period = "1month", limit = 10) => {
    const url = buildUrl(
      "user.gettoptracks",
      {
        user,
        period,
        limit: limit.toString(),
      },
      apiKey,
    );

    return fetchJson<{ toptracks: { track: LastfmTrack[] } }>(url).pipe(
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
  };

  const getListeningData = (): Effect.Effect<
    LastfmResponse,
    FetchError | ApiError
  > =>
    Effect.gen(function* () {
      // Fetch both track types in parallel for better performance
      const [recentTracks, topMonthly] = yield* Effect.all(
        [getRecentTracks(50), getTopTracks("1month", 10)],
        {
          concurrency: "unbounded",
        },
      );

      const threeDaysAgo = Date.now() - Duration.toMillis(Duration.days(3));

      // Process recent tracks to find frequently played
      const recentPlays = recentTracks
        .filter((track) => {
          const utsOption = Option.fromNullable(track.date?.uts);
          return Option.isSome(utsOption)
            ? Number.parseInt(utsOption.value, 10) * 1000 > threeDaysAgo
            : false;
        })
        .reduce<Record<string, number>>((acc, track) => {
          const key = `${track.name}-${track.artist.name}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});

      const frequentRecent: FrequentTrack[] = Object.entries(recentPlays)
        .map(([key, count]) => {
          const [name, artist] = key.split("-", 2);
          const nameOption = Option.fromNullable(name);
          const artistOption = Option.fromNullable(artist);

          if (
            Option.isSome(nameOption) &&
            Option.isSome(artistOption) &&
            count > 2
          ) {
            return {
              name: nameOption.value,
              artist: artistOption.value,
              playcount: count,
            };
          }
          return null;
        })
        .filter((item): item is FrequentTrack => item !== null)
        .sort((a, b) => b.playcount - a.playcount)
        .slice(0, 10);

      return {
        recentTracks: recentTracks
          .filter((track) => track.date?.uts !== undefined)
          .slice(0, 15),
        frequentRecent,
        topMonthly,
      };
    });

  return {
    getListeningData,
  };
};
