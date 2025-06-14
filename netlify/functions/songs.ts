import { Effect } from "effect";
import type { Context, Config } from "@netlify/functions";
import { createLastfmService } from "@@/server/services/lastfm";
import type { LastfmResponse } from "~/types/lastfm";
import { createResponse, isValidMethod } from "../utils";

export const config: Config = {
  path: "/api/songs",
};

const createEmptyResponse = (): LastfmResponse => ({
  recentTracks: [],
  frequentRecent: [],
  topMonthly: [],
});

export default async (req: Request, context: Context) => {
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return createResponse(null, 200);
  }

  // Only allow GET requests
  if (!isValidMethod(req.method)) {
    return createResponse({ error: "Method not allowed" }, 405);
  }

  try {
    // Parse URL to get query parameters
    const url = new URL(req.url);
    const userParam = url.searchParams.get("user");

    // Get environment variables from Netlify
    const apiKey =
      process.env.LASTFM_API_KEY || process.env.NUXT_LASTFM_API_KEY;
    const defaultUser = process.env.NUXT_PUBLIC_LASTFM_USER || "gokaybiz";

    if (!apiKey) {
      console.error("Last.fm API key not found in environment variables");
      return createResponse(createEmptyResponse());
    }

    const username = userParam || defaultUser;

    // Create Last.fm service with config
    const lastfmService = createLastfmService({
      apiKey,
      user: username,
    });

    // Get the data
    const result = await Effect.runPromise(
      lastfmService.getListeningData().pipe(
        Effect.withRequestCaching(true),
        Effect.catchAll((error) => {
          console.error("Last.fm API Error:", error);
          return Effect.succeed(createEmptyResponse());
        }),
      ),
    );

    return createResponse(result, 200);
  } catch (error) {
    console.error("Server error:", error);
    return createResponse(createEmptyResponse());
  }
};
