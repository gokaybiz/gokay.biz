<script setup lang="ts">
import { Effect, pipe } from "effect";
import type {
    PostsCollectionItem,
    PagesCollectionItem,
    Toc,
} from "@nuxt/content";

// --- Types ---
type PostOrPageItem = PostsCollectionItem | PagesCollectionItem;

interface ProcessedPageData {
    readonly title: string;
    readonly description: string;
    readonly formattedDate: string;
    readonly relativeDate: string;
    readonly tags: readonly string[];
    readonly estimatedReadingTime: string | null;
    readonly hasTableOfContents: boolean;
    readonly tocData?: Toc | undefined;
}

interface PageMetadata {
    readonly hasDate: boolean;
    readonly hasTags: boolean;
    readonly hasReadingTime: boolean;
    readonly showTableOfContents: boolean;
}

// --- Props ---
const props = defineProps({
    page: {
        type: Object as PropType<PostOrPageItem>,
        required: true,
    },
    hideToh: {
        type: Boolean,
        default: false,
    },
});

// --- Functions ---
const createProcessedPageData = (
    page: PostOrPageItem,
    estimatedTime: string | null,
): ProcessedPageData => ({
    title: page.title || "Untitled",
    description: page.description || "",
    formattedDate: formatPageDate(page.createdAt),
    relativeDate: formatRelativeDate(page.createdAt),
    tags: extractPageTags(page),
    estimatedReadingTime: estimatedTime,
    hasTableOfContents: hasValidTableOfContents(page),
    tocData: extractTableOfContents(page),
});

const formatPageDate = (createdAt: string | undefined): string => {
    if (!createdAt) return "";
    return useDayjs()(createdAt).format("MMMM D, YYYY");
};

const formatRelativeDate = (createdAt: string | undefined): string => {
    if (!createdAt) return "";
    return useDayjs()(createdAt).fromNow(true);
};

const extractPageTags = (page: PostOrPageItem): readonly string[] => {
    if ("tags" in page && page.tags && Array.isArray(page.tags)) {
        return page.tags as readonly string[];
    }
    return [];
};

const hasValidTableOfContents = (page: PostOrPageItem): boolean => {
    return "body" in page && page.body && "toc" in page.body && !!page.body.toc;
};

const extractTableOfContents = (page: PostOrPageItem): Toc | undefined => {
    if (hasValidTableOfContents(page) && "body" in page) {
        return page.body?.toc ?? undefined;
    }
    return undefined;
};

const createReadingTimeEffect = (page: PostOrPageItem) =>
    pipe(
        Effect.succeed(page),
        Effect.andThen((item) => {
            if (!item || !("rawbody" in item) || !item.rawbody) {
                return Effect.fail(
                    new Error(
                        "No rawbody available for reading time calculation",
                    ),
                );
            }
            return Effect.succeed(item.rawbody);
        }),
        Effect.flatMap((rawbody) => useReadingTime()(rawbody)),
        Effect.catchAll(() => Effect.succeed(null)),
    );

const joinTags = (tags: readonly string[]): string => tags.join(" － ");

const createMetadata = (processedData: ProcessedPageData): PageMetadata => ({
    hasDate: !!processedData.formattedDate,
    hasTags: processedData.tags.length > 0,
    hasReadingTime: processedData.estimatedReadingTime !== null,
    showTableOfContents: processedData.hasTableOfContents,
});

// --- Composables ---
const dayjs = useDayjs();
const readingTime = useReadingTime();

// --- Computed State ---
const estimatedReadingTime = computed(() => {
    if (!props.page) return null;

    return Effect.runSync(createReadingTimeEffect(props.page));
});

const processedPageData = computed(
    (): ProcessedPageData =>
        createProcessedPageData(props.page, estimatedReadingTime.value),
);

const pageMetadata = computed(
    (): PageMetadata => createMetadata(processedPageData.value),
);

const shouldShowTableOfContents = computed(
    (): boolean => !props.hideToh && pageMetadata.value.showTableOfContents,
);

const formattedTags = computed((): string =>
    joinTags(processedPageData.value.tags),
);

// --- SEO Setup ---
const { setPageSeo, createArticleSeo } = useSeo();

// Set up SEO for the page/post
const setupSeo = () => {
    if (!props.page) return;

    // Check if this is a blog post or a page
    const isArticle = "tags" in props.page && props.page.tags;

    if (isArticle) {
        const articleSeo = createArticleSeo({
            title: processedPageData.value.title,
            description: processedPageData.value.description,
            publishedTime: props.page.createdAt,
            modifiedTime: props.page.updatedAt,
            tags: processedPageData.value.tags as string[],
            readingTime:
                processedPageData.value.estimatedReadingTime || undefined,
        });
        setPageSeo(articleSeo);
    } else {
        // Regular page SEO
        setPageSeo({
            type: "website",
            title: processedPageData.value.title,
            url: `https://gokay.biz${useRoute().path}`,
            description:
                processedPageData.value.description ||
                "Explore this page on Gökay Biz - Full-Stack Developer portfolio and blog.",
            canonical: undefined,
        });
    }
};

// Watch for changes in page data and update SEO
watchEffect(() => {
    if (props.page && processedPageData.value) {
        setupSeo();
    }
});

// --- Template Data ---
const metadataItems = computed(() =>
    [
        {
            id: "date",
            show: pageMetadata.value.hasDate,
            icon: "ph-calendar-dots-fill",
            content: `${processedPageData.value.formattedDate} • (${processedPageData.value.relativeDate} ago)`,
        },
        {
            id: "tags",
            show: pageMetadata.value.hasTags,
            icon: "ph-tag-fill",
            content: formattedTags.value,
        },
        {
            id: "reading-time",
            show: pageMetadata.value.hasReadingTime,
            icon: "ph-eye-fill",
            content: `~${processedPageData.value.estimatedReadingTime} to read`,
        },
    ].filter((item) => item.show),
);
</script>

<template>
    <div
        class="responsive-screen doodle mt-10 bg-linear-to-b from-[#fffaf2] to-[#faffff] dark:from-[#23272e] dark:to-[#23282e]"
    >
        <div class="md:py-4 md:px-3 doodle-border -mx-6 md:mx-0">
            <header class="space-y-4 my-2">
                <!-- Metadata Section -->
                <div
                    class="flex border-b-2 border-r-2 border-dashed border-orange-500/20 pb-2 justify-between items-center w-fit"
                >
                    <div
                        class="flex flex-wrap items-center gap-x-6 gap-y-2 dark:text-white/30 text-black/50 text-xs md:text-sm pr-3 pl-1"
                    >
                        <div
                            v-for="item in metadataItems"
                            :key="item.id"
                            class="flex items-center space-x-2"
                        >
                            <Icon
                                :name="item.icon"
                                class="!h-4 !w-4"
                                aria-hidden="true"
                            />
                            <span>{{ item.content }}</span>
                        </div>
                    </div>
                </div>

                <!-- Title and Description -->
                <div class="space-y-2">
                    <h1
                        class="block text-3xl font-caveat font-bold text-stone-600 text-balance sm:text-5xl dark:text-white"
                    >
                        {{ processedPageData.title }}
                    </h1>
                    <p
                        v-if="processedPageData.description"
                        class="font-short-stack text-black/65 dark:text-white/50 text-pretty"
                    >
                        {{ processedPageData.description }}
                    </p>
                </div>

                <hr />
            </header>

            <!-- Table of Contents -->
            <BlogToH
                v-if="shouldShowTableOfContents"
                :toc-data="processedPageData.tocData"
            />

            <!-- Article Content -->
            <article
                class="max-w-full prose dark:prose-invert prose-a:no-underline font-inter"
            >
                <slot />
            </article>
        </div>
    </div>
</template>
