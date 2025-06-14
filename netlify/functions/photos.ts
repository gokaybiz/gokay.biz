import { Effect } from "effect";
import type { Context, Config } from "@netlify/functions";
import { createVscoService } from "@@/server/services/vsco";
import type { VscoImage } from "~/types/vsco";

export const config: Config = {
  path: "/api/photos",
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
    // Get environment variables from Netlify
    const username =
      process.env.NUXT_PUBLIC_VSCO_USER || process.env.VSCO_USER || "gokaybiz";

    const vscoService = createVscoService({
      username,
    });

    const result = await Effect.runPromise(
      vscoService.getImages().pipe(
        Effect.withRequestCaching(true),
        Effect.catchAll((error) => {
          console.error("VSCO API Error:", error);
          return Effect.succeed([] as VscoImage[]);
        }),
      ),
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Server error:", error);
    return new Response(JSON.stringify([] as VscoImage[]), {
      status: 200, // Return 200 with empty array for graceful fallback
      headers,
    });
  }
};
