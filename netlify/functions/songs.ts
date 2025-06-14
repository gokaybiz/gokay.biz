import { Effect } from "effect";
import type { Context, Config } from "@netlify/functions";
import { createLastfmService } from "@@/server/services/lastfm";
import type {
  LastfmTrack,
  FrequentTrack,
  LastfmResponse,
} from "~/types/lastfm";

export const config: Config = {
  path: "/api/songs",
};

export default async (req: Request, context: Context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  // Only allow GET requests
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers,
    });
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
      return new Response(
        JSON.stringify({
          recentTracks: [],
          frequentRecent: [],
          topMonthly: [],
        } as LastfmResponse),
        { status: 200, headers }, // Return empty data instead of error for graceful fallback
      );
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
          return Effect.succeed({
            recentTracks: [] as LastfmTrack[],
            frequentRecent: [] as FrequentTrack[],
            topMonthly: [] as LastfmTrack[],
          } as LastfmResponse);
        }),
      ),
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({
        recentTracks: [],
        frequentRecent: [],
        topMonthly: [],
      } as LastfmResponse),
      {
        status: 200, // Return 200 with empty data for graceful fallback
        headers,
      },
    );
  }
};
