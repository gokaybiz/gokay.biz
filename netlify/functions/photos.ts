import { Effect } from "effect";
import type { Context, Config } from "@netlify/functions";
import { createVscoService } from "@@/server/services/vsco";
import type { VscoImage } from "~/types/vsco";
import { createResponse, createCorsHeaders, isValidMethod } from "../utils";
export const config: Config = {
  path: "/api/photos",
};

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

    return createResponse(result, 200);
  } catch (error) {
    console.error("Server error:", error);
    return createResponse([] as VscoImage[], 200);
  }
};
