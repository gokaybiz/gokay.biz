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
    readonly loaded: boolean;
    readonly id: string;
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
const loadedImages = ref<Record<string, boolean>>({});  // Track loaded state by image ID
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
// This computed ensures that we always know if we should be showing skeletons
const shouldShowSkeleton = computed(() => {
    // Always show skeleton when pending
    return status.value === "pending";
});

const processedImages = computed(
    (): ProcessedImage[] =>
        data.value?.map((image: VscoImage) => ({
            ...image,
            formattedDate: formatImageDate(image.date),
            clickHandler: createImageClickHandler(image.photo_url, (state) => {
                modalState.value = state;
            }),
            loaded: loadedImages.value[image.photo_url] || false,
            id: image.photo_url, // Using photo_url as a unique identifier
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
        // Reset loaded images state when data changes
        loadedImages.value = {};

        if (!newData || newData.length === 0) return;

        // Start preloading each image individually
        newData.forEach((image) => {
            const img = new window.Image();
            img.src = image.photo_url;
            
            const handleLoad = () => {
                // Mark this specific image as loaded
                loadedImages.value = {
                    ...loadedImages.value,
                    [image.photo_url]: true
                };
                console.log(`Image loaded: ${image.photo_url}`);
            };
            
            img.onload = handleLoad;
            img.onerror = handleLoad; // Also mark as "loaded" on error to avoid UI getting stuck
        });

        console.log(`Started loading ${newData.length} images individually...`);
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
                    class="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-8 md:space-y-4"
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
                        :key="img.id"
                        class="break-inside-avoid relative group cursor-pointer mb-4 mx-auto"
                    >
                        <!-- Loading skeleton placeholder -->
                        <div 
                            v-if="!img.loaded" 
                            class="inline-block h-64 min-w-fit w-full rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
                        >
                            <!-- Date overlay still shows in loading state -->
                            <span
                                class="absolute bottom-3 right-3 text-xs bg-white/80 dark:bg-black/60 dark:text-white/60 px-2 py-1 rounded font-mono"
                            >
                                {{ img.formattedDate }}
                            </span>
                        </div>

                        <!-- Actual image (with fade-in effect when loaded) -->
                        <div
                            v-if="img.loaded"
                            class="image-container"
                            @click="img.clickHandler"
                        >
                            <NuxtImg
                                :src="img.photo_url"
                                alt="Photography"
                                class="w-full rounded-lg shadow-md transition-transform duration-300 group-hover:scale-105 fade-in"
                                width="800"
                                height="600"
                            />
                            <div
                                class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-lg group-hover:scale-103 transition-[opacity,transform] duration-150"
                            />
                            <span
                                class="absolute bottom-2 right-3 text-xs bg-white/80 dark:bg-black/60 dark:text-white/60 px-2 py-1 rounded font-mono"
                            >
                                {{ img.formattedDate }}
                            </span>
                        </div>
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

<style scoped>
.fade-in {
  animation: fadeIn 0.4s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.image-container {
  overflow: hidden;
}
</style>
