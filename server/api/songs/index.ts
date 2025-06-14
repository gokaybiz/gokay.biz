import { Effect } from "effect";
import { defineEventHandler, getQuery } from "h3";
import { useRuntimeConfig } from "#imports";

import { createLastfmService } from "~/../server/services/lastfm";

import type {
  LastfmTrack,
  FrequentTrack,
  LastfmResponse,
} from "~/types/lastfm";

// Main handler for the API route
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const config = useRuntimeConfig();

  // Get username from query or use default from config
  const username =
    query.user?.toString() || config.public.lastfmUser || "gokaybiz";

  // Create Last.fm service with config
  const lastfmService = createLastfmService({
    apiKey: config.lastfmApiKey as string,
    user: username,
  });

  try {
    // Get the data
    const result = await Effect.runPromise(
      lastfmService.getListeningData().pipe(
        Effect.withRequestCaching(true),
        Effect.catchAll((error) => {
          console.error("Last.fm API Error:", error);
          return Effect.succeed({
            recentTracks: [] as LastfmTrack[],
            frequentRecent: [] as FrequentTrack[],
            topMonthly: [] as LastfmTrack[],
          });
        }),
      ),
    );

    return result;
  } catch (error) {
    console.error("Server error:", error);
    return {
      recentTracks: [],
      frequentRecent: [],
      topMonthly: [],
    } as LastfmResponse;
  }
});
