import { Effect } from "effect";
import { defineEventHandler } from "h3";
import { useRuntimeConfig } from "#imports";

import { createVscoService } from "~/../server/services/vsco";
import type { VscoImage } from "~/types/vsco";

const config = useRuntimeConfig();
const username = config.public.vscoUser ?? "gokaybiz";
const vscoService = createVscoService({
  username,
});

// Main handler
export default defineEventHandler(async (event) => {
  try {
    const result = await Effect.runPromise(
      vscoService.getImages().pipe(
        Effect.withRequestCaching(true),
        Effect.catchAll((error) => {
          console.error("VSCO API Error:", error);
          return Effect.succeed([] as VscoImage[]);
        }),
      ),
    );
    return result;
  } catch (error) {
    console.error("Server error:", error);
    return [] as VscoImage[];
  }
});
