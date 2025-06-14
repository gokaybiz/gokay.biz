<script setup lang="ts">
import { Effect, pipe } from "effect";
import type { VscoImage } from "~/types/vsco";
import { useDayjs, useSeo, useLazyFetch } from "#imports";
import { watch, computed, ref } from "vue";
// --- Types ---
interface ModalState {
    readonly isOpen: boolean;
    readonly imageSrc: string;
}

interface ProcessedImage extends VscoImage {
    readonly formattedDate: string;
    readonly clickHandler: () => void;
}

// ---Constants---
const MIN_PRELOAD_COUNT = 6;
const SKELETON_COUNT = 6;

// --- Functions  ---
const createModalState = (isOpen: boolean, imageSrc = ""): ModalState => ({
    isOpen,
    imageSrc,
});

const formatImageDate = (date: number): string =>
    dayjs(date).format("YYYY/MM/DD HH:mm");

const createImageClickHandler =
    (src: string, setModal: (state: ModalState) => void) => () =>
        setModal(createModalState(true, src));

const createCloseModalHandler = (setModal: (state: ModalState) => void) => () =>
    setModal(createModalState(false));

const createKeyboardHandler =
    (closeHandler: () => void) => (key: KeyboardEvent) => {
        if (key.key === "Escape") {
            closeHandler();
        }
    };

const calculateMinImageCount = (totalImages: number): number =>
    totalImages > 0
        ? Math.min(MIN_PRELOAD_COUNT, totalImages)
        : MIN_PRELOAD_COUNT;

const createPreloadEffect = (image: VscoImage, onProgress: () => void) =>
    Effect.tryPromise({
        try: () =>
            new Promise<void>((resolve) => {
                const img = new window.Image();
                img.src = image.photo_url;

                const handleComplete = () => {
                    onProgress();
                    resolve();
                };

                img.onload = handleComplete;
                img.onerror = handleComplete;
            }),
        catch: (error: unknown) =>
            new Error(`Error preloading image: ${String(error)}`),
    });

const preloadImages = (
    images: VscoImage[],
    maxCount: number,
    onProgress: () => void,
) => {
    const imagesToPreload = images.slice(0, maxCount);

    return pipe(
        Effect.forEach(
            imagesToPreload,
            (image) => createPreloadEffect(image, onProgress),
            { concurrency: 3 },
        ),
        Effect.catchAll((error: Error) => {
            console.warn(`Image preloading failed: ${error}`);
            return Effect.succeed([]);
        }),
    );
};

/// --- States ---
const modalState = ref<ModalState>(createModalState(false));
const preloadCounter = ref(0);
const preloadTarget = ref(0);
const hasStartedPreloading = ref(false);
const dayjs = useDayjs();
const { setPageSeo } = useSeo();

// --- Fetching ---
const { data, error, status, refresh, clear } = useLazyFetch<VscoImage[]>(
    "/api/photos",
    {
        server: !process.prerender,
    },
);

/// -- Computed props ---
// This computed ensures we always know if we should be preloading
const shouldShowSkeleton = computed(() => {
    // Always show skeleton when pending
    if (status.value === "pending") return true;

    // Show skeleton if we have data but haven't started preloading yet
    if (data.value && data.value.length > 0 && !hasStartedPreloading.value)
        return true;

    // Show skeleton if we're still preloading
    if (
        hasStartedPreloading.value &&
        preloadCounter.value < preloadTarget.value
    )
        return true;

    return false;
});

const processedImages = computed(
    (): ProcessedImage[] =>
        data.value?.map((image: VscoImage) => ({
            ...image,
            formattedDate: formatImageDate(image.date),
            clickHandler: createImageClickHandler(image.photo_url, (state) => {
                modalState.value = state;
            }),
        })) || [],
);

const hasImages = computed(() => data.value && data.value.length > 0);

const showGallery = computed(() => {
    return !shouldShowSkeleton.value && hasImages.value && !error.value;
});

// --- Handlers ---
const closeModalHandler = createCloseModalHandler((state) => {
    modalState.value = state;
});

const keyboardHandler = createKeyboardHandler(closeModalHandler);

// --- Effects ---
const manageBodyScroll = (shouldDisable: boolean): void => {
    document.body.style.overflow = shouldDisable ? "hidden" : "";
};

const manageKeyboardListener = (shouldAdd: boolean): void => {
    if (shouldAdd) {
        document.addEventListener("keydown", keyboardHandler);
    } else {
        document.removeEventListener("keydown", keyboardHandler);
    }
};

// --- Watchers ---
watch(
    () => modalState.value.isOpen,
    (isOpen: boolean) => {
        manageBodyScroll(isOpen);
        manageKeyboardListener(isOpen);
    },
);

// HMR workaround
watch(
    status,
    async (val: unknown) => {
        if (val !== "idle") return;
        clear();
        await refresh();
    },
    { immediate: true },
);

// Preload images
watch(
    () => data.value,
    async (newData) => {
        // Reset preload state immediately when data changes
        preloadCounter.value = 0;
        hasStartedPreloading.value = false;
        preloadTarget.value = 0;

        if (!newData || newData.length === 0) return;

        // Set preload target and mark as started immediately
        preloadTarget.value = calculateMinImageCount(newData.length);
        hasStartedPreloading.value = true;

        console.log(`Starting to preload ${preloadTarget.value} images...`);

        // Now start preloading
        await Effect.runPromise(
            preloadImages(newData, preloadTarget.value, () => {
                preloadCounter.value++;
            }),
        );

        console.log(
            `Preloading complete: ${preloadCounter.value} images loaded`,
        );
    },
    { immediate: true },
);

// SEO Setup
setPageSeo({
    type: "website",
    title: "Photo Gallery",
    description: "Explore my photography collection capturing moments...",
    keywords: [
        "photography",
        "gallery",
        "photos",
        "visual art",
        "creative",
        "portfolio",
    ],
    url: "https://gokay.biz/photos",
    canonical: "/photos",
    image: {
        url: "/og-photos.png",
        alt: "Gökay Biz Photo Gallery - Photography Portfolio",
        width: 1200,
        height: 630,
    },
});
</script>

<template>
    <div class="responsive-screen doodle">
        <fieldset
            class="doodle-border p-6 bg-white dark:bg-gray-900"
            v-if="!error"
        >
            <legend class="px-4">
                <h1
                    class="text-4xl font-caveat font-bold text-[#3c3c3c] dark:text-white"
                >
                    Photo Gallery
                </h1>
            </legend>

            <div class="mt-6">
                <!-- Skeleton state -->
                <div
                    v-if="shouldShowSkeleton"
                    class="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4"
                >
                    <div
                        v-for="i in SKELETON_COUNT"
                        :key="`skeleton-${i}`"
                        class="break-inside-avoid rounded-lg bg-gray-100 dark:bg-gray-800 h-96 animate-pulse"
                    />
                </div>

                <!-- Gallery state -->
                <div
                    v-else-if="showGallery"
                    class="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-8 md:space-y-4"
                >
                    <div
                        v-for="img in processedImages"
                        :key="img.photo_url"
                        class="break-inside-avoid relative group cursor-pointer"
                        @click="img.clickHandler"
                    >
                        <NuxtImg
                            :src="img.photo_url"
                            alt="Photography"
                            class="w-full rounded-lg shadow-md transition-transform duration-300 group-hover:scale-105"
                            width="800"
                            height="600"
                        />
                        <div
                            class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-lg group-hover:scale-107 transition-[opacity,transform] duration-150"
                        />
                        <span
                            class="absolute bottom-2 right-3 text-xs bg-white/80 dark:bg-black/60 dark:text-white/60 px-2 py-1 rounded font-mono"
                        >
                            {{ img.formattedDate }}
                        </span>
                    </div>
                </div>

                <!-- Empty state -->
                <div v-else class="text-center text-gray-400 py-12">
                    No photos found.
                </div>
            </div>
        </fieldset>

        <!-- Modal for image preview -->
        <div
            v-if="modalState.isOpen"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
            @click.self="closeModalHandler"
        >
            <NuxtImg
                :src="modalState.imageSrc"
                class="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl border-4 border-white"
            />
            <button
                class="absolute top-6 right-6 text-white text-3xl font-bold cursor-pointer"
                @click="closeModalHandler"
            >
                ×
            </button>
        </div>
        <div v-if="error" class="p-10 text-center text-red-500">
            Failed to load photos.
        </div>
    </div>
</template>
