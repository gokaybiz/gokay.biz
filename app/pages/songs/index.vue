<script setup lang="ts">
import type {
    FrequentTrack,
    LastfmResponse,
    LastfmTrack,
} from "~/types/lastfm";

import { useSeo, useLazyFetch, useDayjs, createError } from "#imports";
import { computed, ref, watch } from "vue";

// --- Types ---
interface ProcessedTrack {
    readonly name: string;
    readonly artist: string;
    readonly imageUrl: string;
    readonly formattedDate?: string;
    readonly playcount?: number;
    readonly hoverKey: string;
}

interface HoverState {
    readonly activeKey: string | null;
}

type LoadingState =
    | { readonly status: "pending" }
    | { readonly status: "loaded" }
    | { readonly status: "error"; readonly error: unknown };

// --- Constants ---
const SKELETON_COUNTS = {
    recent: 12,
    frequent: 12,
    monthly: 5,
} as const;

const RANK_STYLES = {
    0: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200",
    1: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
    2: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200",
    default: "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
} as const;

const PLACEHOLDER_IMAGE =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAPFBMVEVHcEz/xhv/xhr/xhr/xhv/xhr/xhr/xhr/xx3/xxj/xxv/xxv/xxr/xhv/xxr/xxr/xhv+4Yb/1FD/yihwNIyoAAAAEHRSTlMA8uZaxU2DrgkfcJUU1jA89AlfcAAAAqpJREFUeNq1V0mW6yAMZBAgRuu773/X/6IkQCAmbud1LbIwqdLEIIkjJGMdZElSZXDBJPErlJhpQLblLBsDs2fkgCfoycrKUOCcA1Dtg/0ooRUxpAsFq09bcA/ZvFbwQAxncArMOF4qS/OSjUd/IB8lwYpv79b9IkHbIgJkF5URF9D4LomrYH4Ul8Hxh+t8/Vt+0l508PKs/+iR+YpkrwBE5D7Z3EJ06rEXNyKC1wBUWlK7A2Fujqg+5KT485raoG8r5mYTawXeBhBA0gCpWOBZdisYKIkzMkC/UiEG49mwrnmXeLf0vgL2lcroBESsWchE5N8LtMtwFvBElPn+OyihfaPrQxPgLGwPV8xCYKqH7ryJ9wgkLgV0rPXoBVByDIkjWAnoeR+0GBI7EpYCtitl7AS4fIaXy1LAZ1IQw5b6KjzTb9kPFOsk4lRGBnL0QKTEQqBiFhCKCPjnqgAbl0TuqoAjkoK+E6BvBeTJEFA7gAyQRwF1LolG0QNjEvOpMhqqmMo4byTU0d2QWaBe+vTDmDbStJV19bYKxBv9H2OftvJ4mALRJKCYf8d0mIbjvBE93a0CiZrAPh3n4UKBztteYO8ETHehwHCleeYPAkK+fizdprLDpWoGY766utdvqo+gDNf6KJBaYn72fee8hM7bPD4sWyfwQyTFHZEaAMX4sKCqTxvK5m1fHVv5DruWQmFbdt0/96e3ppXXSW5fzctRDvPzjpkaouiBKQ3nWuGbBiPB4O2EZlNPLU7f7IMRx2ACHDZZqZSCYoVIY0thaoVPN5Vm0Wie4dvJq3Wru/5na7YhfaInOKoQxnW731+vES8OHN4Rx38oL4k37PHIw+v6q6GLwF8Y+0od+5QWH4C2mzMBhsEz4N+PvoxiJw1YDN/L8Z9kBmePx///yFZODHgL9/EAAAAASUVORK5CYII=";

// --- Functions ---
const createHoverState = (activeKey: string | null = null): HoverState => ({
    activeKey,
});

const createHoverKey = (section: string, index: number): string =>
    `${section}-${index}`;

const formatTrackDate = (date: LastfmTrack["date"]): string => {
    if (!date || !date.uts) return "";
    const dateTime = useDayjs().unix(Number.parseInt(date.uts));
    return dateTime.format("YYYY-MM-DD HH:mm:ss Z");
};

const extractArtistName = (artist: LastfmTrack["artist"]): string => {
    if (typeof artist === "string") return artist;
    if (typeof artist === "object" && artist !== null && "name" in artist) {
        return artist.name;
    }
    return "Unknown";
};

const extractImageUrl = (image: LastfmTrack["image"]): string => {
    if (!image) return PLACEHOLDER_IMAGE;
    if (typeof image === "string") return image;
    if (Array.isArray(image)) {
        const largeImage = image.find((img) => img.size === "large");
        return largeImage?.["#text"] || PLACEHOLDER_IMAGE;
    }
    return PLACEHOLDER_IMAGE;
};

const processRecentTrack = (
    track: LastfmTrack,
    index: number,
): ProcessedTrack => ({
    name: track.name,
    artist: extractArtistName(track.artist),
    imageUrl: extractImageUrl(track.image),
    formattedDate: formatTrackDate(track.date),
    hoverKey: createHoverKey("recent", index),
});

const processFrequentTrack = (
    track: FrequentTrack,
    index: number,
): ProcessedTrack => ({
    name: track.name,
    artist: track.artist,
    imageUrl: PLACEHOLDER_IMAGE, // Frequent tracks don't have images
    playcount: track.playcount,
    hoverKey: createHoverKey("frequent", index),
});

const processMonthlyTrack = (
    track: LastfmTrack,
    index: number,
): ProcessedTrack => ({
    name: track.name,
    artist: extractArtistName(track.artist),
    imageUrl: extractImageUrl(track.image),
    playcount: track.playcount,
    hoverKey: createHoverKey("monthly", index),
});

const getRankStyle = (index: number): string => {
    return (
        RANK_STYLES[index as keyof typeof RANK_STYLES] || RANK_STYLES.default
    );
};

const getHoverAnimation = (
    section: string,
    isActive: boolean,
): Record<string, boolean> => {
    const animations = {
        recent: { "animate-pulse": isActive },
        frequent: { "animate-bounce": isActive },
        monthly: { "animate-spin": isActive },
    };
    return animations[section as keyof typeof animations] || {};
};

const formatPlaycount = (count: number): string => {
    return `${count} play${count > 1 ? "s" : ""}`;
};

const createHoverHandlers = (
    hoverKey: string,
    setHover: (state: HoverState) => void,
) => ({
    onMouseenter: () => setHover(createHoverState(hoverKey)),
    onMouseleave: () => setHover(createHoverState()),
});

// --- State Management ---
const hoverState = ref<HoverState>(createHoverState());

// --- Data Fetching ---
const { data, error, status, refresh, clear } = useLazyFetch<LastfmResponse>(
    "/api/songs",
    {
        server: !process.prerender,
    },
);

// Handle errors
if (error.value) {
    throw createError({
        statusCode: 500,
        statusMessage: error.value?.message || "Internal Server Error",
        fatal: true,
    });
}

// --- Computed Properties ---
const loadingState = computed((): LoadingState => {
    if (error.value) return { status: "error", error: error.value };
    if (status.value === "pending") return { status: "pending" };
    return { status: "loaded" };
});

const processedRecentTracks = computed(
    (): ProcessedTrack[] =>
        data.value?.recentTracks?.map(processRecentTrack) ?? [],
);

const processedFrequentTracks = computed(
    (): ProcessedTrack[] =>
        data.value?.frequentRecent?.map(processFrequentTrack) ?? [],
);

const processedMonthlyTracks = computed(
    (): ProcessedTrack[] =>
        data.value?.topMonthly?.map(processMonthlyTrack) ?? [],
);

const hasFrequentTracks = computed(
    () => data.value?.frequentRecent && data.value.frequentRecent.length > 0,
);

const isTrackHovered = (hoverKey: string): boolean =>
    hoverState.value.activeKey === hoverKey;

const isLoading = computed(() => loadingState.value.status === "pending");
const isLoaded = computed(() => loadingState.value.status === "loaded");

// --- Event Handlers ---
const createTrackHoverHandlers = (hoverKey: string) =>
    createHoverHandlers(hoverKey, (state) => {
        hoverState.value = state;
    });

// HMR workaround watcher
watch(
    status,
    async (val: unknown) => {
        if (val !== "idle") return;
        clear();
        await refresh();
    },
    { immediate: true },
);

const { setPageSeo } = useSeo();

// SEO Setup
setPageSeo({
    type: "website",
    title: "Music Journey",
    description:
        "Discover my music taste and listening habits. Explore recently played tracks, top artists, and musical discoveries.",
    keywords: [
        "music",
        "lastfm",
        "listening",
        "tracks",
        "artists",
        "music taste",
        "discovery",
    ],
    url: "https://gokay.biz/songs",
    canonical: "/songs",
    image: {
        url: "/og-music.png",
        alt: "Gökay's Music Journey - Live Listening Stats",
        width: 1200,
        height: 630,
    },
});
</script>

<template>
    <div class="responsive-screen doodle">
        <fieldset
            v-if="!error"
            class="doodle-border p-6 bg-white dark:bg-gray-900"
        >
            <legend class="px-4">
                <h1
                    class="text-4xl font-caveat font-bold text-[#3c3c3c] dark:text-white"
                >
                    Music Journey
                </h1>
            </legend>

            <div class="space-y-8 mt-8">
                <!-- Recently Played Tracks -->
                <section
                    class="doodle-border-another p-6 rounded-xl bg-white dark:bg-gray-800"
                >
                    <h2
                        class="text-2xl font-short-stack text-primary-600 dark:text-orange-300 mb-4 flex items-center"
                    >
                        <Icon name="ph:music-notes" class="!w-6 !h-6 mr-2" />
                        Latest Tracks
                    </h2>

                    <!-- Loading State -->
                    <div
                        v-if="isLoading"
                        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse space-y-4"
                    >
                        <div
                            v-for="i in SKELETON_COUNTS.recent"
                            :key="`recent-skeleton-${i}`"
                            class="h-24 bg-gray-100 dark:bg-gray-700 rounded"
                        />
                    </div>

                    <!-- Loaded State -->
                    <div
                        v-else-if="isLoaded"
                        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        <article
                            v-for="track in processedRecentTracks"
                            :key="track.hoverKey"
                            class="flex items-center p-3 doodle-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:-translate-y-1"
                            v-bind="createTrackHoverHandlers(track.hoverKey)"
                        >
                            <div
                                class="w-12 h-12 rounded-sm mr-3 flex items-center justify-center overflow-hidden"
                                :class="
                                    getHoverAnimation(
                                        'recent',
                                        isTrackHovered(track.hoverKey),
                                    )
                                "
                            >
                                <img
                                    :src="track.imageUrl"
                                    :alt="`${track.artist} - ${track.name}`"
                                    class="w-full h-full object-cover"
                                />
                            </div>
                            <div class="flex-1">
                                <p
                                    class="font-medium text-gray-700 dark:text-gray-200"
                                >
                                    {{ track.name }}
                                </p>
                                <p
                                    class="text-sm text-gray-500 dark:text-gray-400"
                                >
                                    {{ track.artist }}
                                </p>
                                <time
                                    v-if="track.formattedDate"
                                    class="text-s text-zinc-400 dark:text-gray-500 mt-1 font-caveat"
                                >
                                    {{ track.formattedDate }}
                                </time>
                            </div>
                        </article>
                    </div>
                </section>

                <!-- Frequent Recent -->
                <section
                    v-if="isLoading || hasFrequentTracks"
                    class="doodle-border-another p-6 rounded-xl bg-white dark:bg-gray-800"
                >
                    <h2
                        class="text-2xl font-short-stack text-primary-600 dark:text-orange-300 mb-4 flex items-center"
                    >
                        <Icon name="ph:repeat" class="!w-6 !h-6 mr-2" />
                        Recent Obsessions
                    </h2>

                    <!-- Loading State -->
                    <div
                        v-if="isLoading"
                        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse space-y-4"
                    >
                        <div
                            v-for="i in SKELETON_COUNTS.frequent"
                            :key="`frequent-skeleton-${i}`"
                            class="h-20 bg-gray-100 dark:bg-gray-700 rounded"
                        />
                    </div>

                    <!-- Loaded State -->
                    <div
                        v-else-if="isLoaded"
                        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        <article
                            v-for="(track, index) in processedFrequentTracks"
                            :key="track.hoverKey"
                            class="flex items-center p-3 doodle-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:-translate-y-1"
                            v-bind="createTrackHoverHandlers(track.hoverKey)"
                        >
                            <div
                                class="w-8 h-8 rounded-full flex items-center justify-center bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200 font-caveat font-bold mr-3"
                                :class="
                                    getHoverAnimation(
                                        'frequent',
                                        isTrackHovered(track.hoverKey),
                                    )
                                "
                            >
                                #{{ index + 1 }}
                            </div>
                            <div class="flex-1">
                                <p
                                    class="font-medium text-gray-700 dark:text-gray-200"
                                >
                                    {{ track.name }}
                                </p>
                                <p
                                    class="text-sm text-gray-500 dark:text-gray-400"
                                >
                                    {{ track.artist }}
                                </p>
                            </div>
                            <span
                                class="ml-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-short-stack"
                            >
                                {{ track.playcount }}×
                            </span>
                        </article>
                    </div>
                </section>

                <!-- Monthly Top -->
                <section
                    class="doodle-border-another p-6 rounded-xl bg-white dark:bg-gray-800"
                >
                    <h2
                        class="text-2xl font-short-stack text-primary-600 dark:text-orange-300 mb-4 flex items-center"
                    >
                        <Icon name="ph:chart-line-up" class="!w-6 !h-6 mr-2" />
                        Monthly Favorites
                    </h2>

                    <!-- Loading State -->
                    <div v-if="isLoading" class="animate-pulse space-y-4">
                        <div
                            v-for="i in SKELETON_COUNTS.monthly"
                            :key="`monthly-skeleton-${i}`"
                            class="h-16 bg-gray-100 dark:bg-gray-700 rounded"
                        />
                    </div>

                    <!-- Loaded State -->
                    <div
                        v-else-if="isLoaded"
                        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        <article
                            v-for="(track, index) in processedMonthlyTracks"
                            :key="track.hoverKey"
                            class="flex items-center flex-1 flex-col p-3 doodle-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:-translate-y-1"
                            v-bind="createTrackHoverHandlers(track.hoverKey)"
                        >
                            <div class="w-60 h-24 flex items-center">
                                <div
                                    class="w-8 h-8 rounded-full flex items-center justify-center"
                                    :class="[
                                        getRankStyle(index),
                                        getHoverAnimation(
                                            'monthly',
                                            isTrackHovered(track.hoverKey),
                                        ),
                                    ]"
                                >
                                    <span class="font-caveat font-bold">{{
                                        index + 1
                                    }}</span>
                                </div>
                                <div
                                    class="w-10 h-10 rounded-sm mx-3 flex items-center justify-center overflow-hidden"
                                >
                                    <img
                                        :src="track.imageUrl"
                                        :alt="`${track.artist} - ${track.name}`"
                                        class="w-full h-full object-cover"
                                    />
                                </div>
                                <div class="flex-1">
                                    <p
                                        class="font-medium text-gray-700 dark:text-gray-200"
                                    >
                                        {{ track.name }}
                                    </p>
                                    <p
                                        class="text-sm text-gray-500 dark:text-gray-400"
                                    >
                                        {{ track.artist }}
                                    </p>
                                </div>
                            </div>

                            <span
                                class="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-short-stack block"
                            >
                                {{ formatPlaycount(track.playcount ?? 0) }}
                            </span>
                        </article>
                    </div>
                </section>
            </div>

            <!-- Musical Note Decorations -->
            <div class="relative h-20 mt-10">
                <div
                    class="absolute top-0 left-1/5 transform -translate-x-1/2 rotate-12"
                >
                    <Icon
                        name="ph:music-note"
                        class="!w-10 !h-10 text-gray-300 dark:text-gray-700"
                    />
                </div>
                <div
                    class="absolute top-5 left-1/2 transform -translate-x-1/2 -rotate-6"
                >
                    <Icon
                        name="ph:music-notes"
                        class="!w-16 !h-16 text-gray-200 dark:text-gray-800"
                    />
                </div>
                <div
                    class="absolute top-2 right-1/5 transform translate-x-1/2 rotate-6"
                >
                    <Icon
                        name="ph:radio"
                        class="!w-12 !h-12 text-gray-300 dark:text-gray-700"
                    />
                </div>
            </div>
        </fieldset>

        <div v-else class="p-10 text-center text-red-500">
            Failed to load songs.
        </div>
    </div>
</template>

<style scoped>
.animate-spin {
    animation: spin 1s linear infinite;
}
@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.animate-bounce {
    animation: bounce 1s ease infinite;
}
@keyframes bounce {
    0%,
    100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-10px);
    }
}

.animate-pulse {
    animation: pulse 1.5s ease infinite;
}
@keyframes pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.6;
    }
}
</style>
