<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";

// --- Types ---
type ImageSource = string | null;
type ImageFit = "cover" | "contain" | "fill" | "scale-down" | "none";
type Dimension = string | null;
type ImageText = string | null;

interface Props {
  src?: ImageSource;
  title?: ImageText;
  alt?: ImageText;
  fit?: ImageFit;
  width?: Dimension;
  height?: Dimension;
  caption?: ImageText;
  optimize?: boolean;
}

// ADT for image loading state
type ImageState =
  | { readonly status: "loading" }
  | { readonly status: "loaded" }
  | { readonly status: "error"; readonly originalUrl: string };

// --- Props ---
const props = withDefaults(defineProps<Props>(), {
  src: null,
  title: null,
  alt: null,
  fit: "cover",
  width: null,
  height: null,
  caption: null,
  optimize: true,
});

const loadedSize = reactive({
  width: props.width,
  height: props.height
});

// --- Constants ---
const FALLBACK_URL = "/icon.png";

// --- State ---
const imageState = ref<ImageState>({ status: "loading" });

// --- Functions ---
const createLoadingState = (): ImageState => ({ status: "loading" });
const createLoadedState = (): ImageState => ({ status: "loaded" });
const createErrorState = (originalUrl: string): ImageState => ({
  status: "error",
  originalUrl,
});

const proxifyUrl = (url: string): string =>
  `https://external-content.duckduckgo.com/iu/?u=${encodeURIComponent(url)}&f=1&nofb=1`;

const getSafeImageUrl = (
  source: ImageSource,
  shouldOptimize: boolean,
): string => {
  if (!source) return FALLBACK_URL;
  return shouldOptimize ? proxifyUrl(source) : source;
};

const getDisplayUrl = (
  state: ImageState,
  src: ImageSource,
  optimize: boolean,
): string => {
  if (state.status === "error") return FALLBACK_URL;
  if (!src) return FALLBACK_URL;
  return getSafeImageUrl(src, optimize);
};

const createImageStyles = (width?: Dimension, height?: Dimension) => ({
  ...(width ? { width: `${Number.parseInt(width)}px` } : {}),
  ...(height ? { height: `${Number.parseInt(height)}px` } : {}),
});

const createBackgroundStyle = (
  isLoaded: boolean,
  url: string,
  fit: ImageFit,
) =>
  isLoaded
    ? {
        display: "inline-block",
        backgroundImage: `url('${url}')`,
        backgroundPosition: "center",
        backgroundSize: fit,
      }
    : {};

const parseIntSafe = (value: string): number => Number.parseInt(value);

const loadImageAsync = (url: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      loadedSize.width ??= image.width;
      loadedSize.height ??= image.height;
      return resolve();
    }
    image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    image.src = url;
  });

// --- State Transitions ---
const transitionToLoaded = (): void => {
  imageState.value = createLoadedState();
};

const transitionToError = (originalUrl: string): void => {
  imageState.value = createErrorState(originalUrl);
};

const transitionToLoading = (): void => {
  imageState.value = createLoadingState();
};

// --- Computed Properties ---
const displayUrl = computed((): string =>
  getDisplayUrl(imageState.value, props.src, props.optimize),
);

const isLoaded = computed((): boolean => imageState.value.status === "loaded");

const imageStyles = computed(() =>
  createImageStyles(loadedSize.width, loadedSize.height),
);

const backgroundStyle = computed(() => ({
  ...createBackgroundStyle(isLoaded.value, displayUrl.value, props.fit),
  ...imageStyles.value,
}));

const hasCaption = computed((): boolean => Boolean(props.caption));
const displayTitle = computed(
  (): string | undefined => props.title || props.caption || undefined,
);

const failedImageUrl = computed((): string | undefined =>
  imageState.value.status === "error" ? props.src || undefined : undefined,
);

// --- Side Effect Management ---
const loadImage = async (url: string): Promise<void> => {
  try {
    await loadImageAsync(url);
    transitionToLoaded();
  } catch (error) {
    if (props.optimize && props.src) {
      transitionToError(props.src);
    }
  }
};

const initializeImageLoad = (src: ImageSource): void => {
  if (!src) return;

  transitionToLoading();
  const url = getSafeImageUrl(src, props.optimize);
  loadImage(url);
};

// --- Watchers ---
watch(
  () => props.src,
  (newSrc: ImageSource) => initializeImageLoad(newSrc),
  { immediate: false },
);

// --- Lifecycle ---
onMounted(() => {
  initializeImageLoad(props.src);
});
</script>

<template>
  <span
    v-if="props.src"
    :style="backgroundStyle"
    :class="{
      'bg-gray-100 animate-pulse dark:bg-neutral-700 bg-no-repeat': !isLoaded,
      'relative caption': hasCaption,
    }"
    :title="displayTitle"
    :failed-image-url="failedImageUrl"
  >
    <span
      v-if="hasCaption"
      class="mx-8 text-center text-sm inset-x-0 -bottom-7 text-neutral-400 truncate absolute"
    >
      {{ props.caption }}
    </span>
  </span>
</template>
