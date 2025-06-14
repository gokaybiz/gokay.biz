<script setup lang="ts">
import type { PostsCollectionItem } from "@nuxt/content";
import { Effect, Console, Exit } from "effect";

import ContentLayout from "~/layouts/ContentLayout.vue";

definePageMeta({
    pageTransition: {
        name: "page",
        mode: "out-in",
    },
});

const route = useRoute();

// --- Types ---
type FetchPageError = PostNotFoundError | PostFetchingError;

// --- Custom Error Types ---
class PostNotFoundError extends Error {
    readonly _tag = "PostNotFoundError";
    constructor(readonly path: string) {
        super(`Post not found at path: ${path}`);
    }
}

class PostFetchingError extends Error {
    readonly _tag = "PostFetchingError";
    constructor(
        readonly path: string,
        override readonly cause?: unknown,
    ) {
        super(`Failed to fetch post at path: ${path}.`);
        this.name = "PostFetchingError";
    }
}

// --- Effects ---
const fetchPost = (path: string) =>
    Effect.tryPromise({
        try: () =>
            queryCollection("posts").path(path).first() as Promise<
                PostsCollectionItem | null | undefined
            >,
        catch: (unknownError) => new PostFetchingError(path, unknownError),
    });

const validatePost = (
    post: PostsCollectionItem | null | undefined,
    path: string,
) => (post ? Effect.succeed(post) : Effect.fail(new PostNotFoundError(path)));

const createNuxtError = (error: FetchPageError) => {
    let statusCode = 500;
    let statusMessage = "Something went wrong.";

    switch (error._tag) {
        case "PostNotFoundError":
            statusCode = 404;
            statusMessage = error.message || "Post not found.";
            break;
        case "PostFetchingError":
            statusCode = 500;
            statusMessage =
                error.message || "An error occurred while fetching the post.";
            break;
    }

    return {
        __isError: true,
        statusCode,
        statusMessage,
    };
};

const fetchPageData = (
    currentPath: string,
): Effect.Effect<PostsCollectionItem, FetchPageError> =>
    fetchPost(currentPath).pipe(
        Effect.flatMap((post) => validatePost(post, currentPath)),
        Effect.tapError((error) =>
            Console.log(
                `Error fetching page data at path ${currentPath}: ${error.message}`,
                error,
            ),
        ),
    );

const runPageEffect = async () => {
    const currentPath = route.path;
    const exit = await Effect.runPromiseExit(fetchPageData(currentPath));

    if (Exit.isFailure(exit)) {
        const error =
            exit.cause._tag === "Fail"
                ? exit.cause.error
                : new PostFetchingError(currentPath, "Unknown error");

        return createNuxtError(error);
    }

    return exit.value;
};

const { data: page } = await useAsyncData(`post-${route.path}`, runPageEffect);

if (page.value && typeof page.value === "object" && "__isError" in page.value) {
    const errorData = page.value;
    throw createError({
        statusCode: errorData.statusCode,
        statusMessage: errorData.statusMessage,
        fatal: true,
    });
}

const validPage = page as Ref<PostsCollectionItem | null>;
</script>

<template>
    <div>
        <div v-if="validPage">
            <ContentLayout :page="validPage">
                <ContentRenderer :value="validPage" />
            </ContentLayout>
        </div>
    </div>
</template>
