<script setup lang="ts">
import type { PostsCollectionItem } from "@nuxt/content";
import { Effect, pipe, Request, RequestResolver } from "effect";

const route = useRoute();
const router = useRouter();
const dayjs = useDayjs();
const { setPageSeo } = useSeo();

// SEO Setup
setPageSeo({
    type: "website",
    title: "Blog",
    description:
        "Explore my thoughts on web development, programming and technology. Stay updated with the latest posts on coding and projects.",
    keywords: [
        "blog",
        "web development",
        "programming",
        "typescript",
        "nuxt",
        "python",
    ],
    url: "https://gokay.biz/blog",
    canonical: "/blog",
    image: {
        url: "/og-blog.png",
        alt: "Gökay's Blog - Life Insights and Web Development",
        width: 1200,
        height: 630,
    },
});

class NoPostsError extends Error {
    readonly _tag = "NoPostsError";
    constructor() {
        super("All of posts are already displayed?!");
    }
}

interface FetchPosts
    extends Request.Request<
        {
            items: PostsCollectionItem[];
            total: number;
        },
        Error
    > {
    readonly _tag: "FetchPosts";
    readonly page: number;
    readonly pageSize: number;
}

const FetchPosts = Request.tagged<FetchPosts>("FetchPosts");

const FetchPostsResolver = RequestResolver.fromEffect(
    (
        request: FetchPosts,
    ): Effect.Effect<
        {
            items: PostsCollectionItem[];
            total: number;
        },
        Error
    > => {
        const skip = (request.page - 1) * request.pageSize;
        const limit = request.pageSize;

        return Effect.tryPromise({
            try: async () => {
                const [items, total] = await Promise.all([
                    queryCollection("posts")
                        .order("updatedAt", "DESC")
                        .order("createdAt", "DESC")
                        .limit(limit)
                        .skip(skip)
                        .all(),
                    queryCollection("posts").count(),
                ]);
                return { items, total };
            },
            catch: (error) =>
                new Error(`Error fetching posts: ${String(error)}`),
        });
    },
);

const fetchPostsEffect = (
    page: number,
    pageSize: number,
): Effect.Effect<
    {
        items: PostsCollectionItem[];
        total: number;
    },
    Error
> => {
    return pipe(
        Effect.request(FetchPosts({ page, pageSize }), FetchPostsResolver),
        Effect.flatMap(({ items, total }) =>
            items?.length > 0
                ? Effect.succeed({ items, total })
                : Effect.fail(new NoPostsError()),
        ),
    );
};

//Pagination stuff
const currentPage = computed(() => {
    const page = Number(route.query.page) || 1;
    return page > 0 ? page : 1;
});
const postsPerPage = 2;

const {
    data: posts,
    error,
    status,
} = await useAsyncData(
    "posts-page",
    async () =>
        await Effect.runPromise(
            fetchPostsEffect(currentPage.value, postsPerPage),
        ),
    { watch: [currentPage] },
);

const nextPage = () => {
    if (posts?.value?.items && posts?.value.items.length >= postsPerPage) {
        router.push(`/blog?page=${currentPage.value + 1}`);
    }
};

const prevPage = () => {
    if (currentPage.value > 1) {
        router.push(`/blog?page=${currentPage.value - 1}`);
    }
};

// Validate page number
if (currentPage.value !== (Number(route.query.page) || 1)) {
    await router.replace(`/blog?page=${currentPage.value}`);
}
</script>

<template>
    <div class="responsive-screen doodle">
        <fieldset class="bg-slate-200 dark:bg-gray-900">
            <legend>
                <h1
                    class="text-4xl font-caveat font-bold mx-2 text-[#3c3c3c] dark:text-white"
                >
                    Blog Posts
                </h1>
            </legend>
            <div v-if="(!error && status !== 'pending') || status !== 'idle'">
                <transition-group name="fade" tag="ol" class="space-y-4 p-5">
                    <li v-for="post in posts?.items" :key="post.id">
                        <nuxt-link
                            :to="`${post.path}`"
                            class="text-sm md:text-xl font-short-stack font-normal hover:text-blue-500 flex"
                        >
                            <div
                                class="p-4 rounded-lg transition-colors duration-200 doodle-border-another bg-stone-100 hover:bg-gray-50 dark:bg-gray-800 hover:dark:bg-gray-600 w-full flex flex-6/12 justify-between"
                            >
                                <h3
                                    class="text-sm md:text-xl font-short-stack text-primary-500 dark:text-zinc-300"
                                >
                                    {{ post.title }}
                                </h3>
                                <p
                                    class="font-caveat text-sm md:text-xl italic text-gray-600 dark:text-gray-300"
                                >
                                    {{ dayjs(post.createdAt).fromNow(true) }}
                                    ago
                                </p>
                            </div>
                        </nuxt-link>
                    </li>
                </transition-group>
                <div class="flex justify-center p-4">
                    <button
                        @click="nextPage"
                        :disabled="
                            currentPage * postsPerPage >= (posts?.total || -1)
                        "
                        class="text-sm md:text-base px-4 py-2 mx-2 bg-gray-200 dark:bg-gray-600 dark:text-slate-300 rounded disabled:opacity-50 enabled:cursor-pointer"
                    >
                        Previous posts
                    </button>
                    <button
                        @click="prevPage"
                        :disabled="currentPage === 1"
                        class="text-sm md:text-base px-4 py-2 mx-2 bg-gray-200 dark:bg-gray-600 dark:text-slate-300 rounded disabled:opacity-50 enabled:cursor-pointer"
                    >
                        Newer posts
                    </button>
                </div>
            </div>
            <div v-else>
                <p>{{ error?.message || error?.toJSON() }}</p>
            </div>
        </fieldset>
    </div>
</template>
<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
