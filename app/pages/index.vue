<script setup lang="ts">
import { Effect, pipe } from "effect";
import { navigateTo } from "#app";
import type { PostsCollectionItem } from "@nuxt/content";
import {
  useSeo,
  useDayjs,
  queryCollection,
  useAsyncData,
  useDarkMode,
} from "#imports";
import { computed } from "vue";

// --- Types ---
interface QuickLink {
  readonly title: string;
  readonly to: string;
  readonly icon: string;
}

interface Activity {
  readonly icon: string;
  readonly description: string;
}

const { setPageSeo, createHomepageSeo } = useSeo();
// SEO Setup
const homepageSeoData = createHomepageSeo();
setPageSeo(homepageSeoData);

const dayjs = useDayjs();
const quickLinks: QuickLink[] = [
  { title: "Blog", to: "/blog", icon: "ph:file-text" },
  { title: "About", to: "/about", icon: "ph:user" },
  { title: "Projects", to: "/projects", icon: "ph:shapes" },
  { title: "Photos", to: "/photos", icon: "ph:camera" },
  { title: "Contact", to: "/contact", icon: "ph:at" },
  { title: "Songs", to: "/songs", icon: "ph:headphones" },
];

const activities: Activity[] = [
  {
    icon: "ph:code",
    description: "Working on refactoring old projects.",
  },
  {
    icon: "ph:translate",
    description: "Learning Swedish.",
  },
  {
    icon: "ph:music-note-simple",
    description: "Exploring new music tastes.",
  },
];

const createPostQuery = (count: number) =>
  queryCollection("posts")
    .limit(count)
    .order("createdAt", "DESC")
    .order("updatedAt", "DESC");

const fetchLatestPosts = (count: number) =>
  Effect.tryPromise({
    try: () => createPostQuery(count).all() as Promise<PostsCollectionItem[]>,
    catch: (error: unknown) =>
      new Error(`Error fetching posts: ${String(error)}`),
  });

const createPostsEffect = (count: number) =>
  pipe(
    fetchLatestPosts(count),
    Effect.catchAll((error: unknown) => {
      console.error("Error fetching latest posts:", error);
      return Effect.succeed([]);
    }),
  );

// Fetch the latest posts
const { data: latestPosts } = await useAsyncData("latest-posts", () =>
  Effect.runPromise(createPostsEffect(5)),
);

const createNavigationHandler = (path: string) => () => navigateTo(path);

const hasLatestPosts = computed(
  () => latestPosts.value && latestPosts.value.length > 0,
);

const processedPosts = computed(
  () =>
    latestPosts.value?.map((post) => ({
      ...post,
      formattedDate: dayjs(post?.createdAt).fromNow(true),
      navigationHandler: createNavigationHandler(post.path),
    })) ?? [],
);

const toggleDarkMode = useDarkMode();
</script>

<template>
  <div class="max-w-6xl mx-auto pt-10 doodle">
    <DarkModeCord :event="() => toggleDarkMode()" />
    <div class="mb-12 text-center">
      <h1
        class="text-7xl font-dancing-script font-bold text-primary-600 dark:text-stone-500 mb-4"
      >
        Welcome!
      </h1>
      <h2
        class="text-6xl font-dancing-script font-bold text-primary-700 dark:dark:text-stone-400 mb-4"
      >
        I'm
        <span class="text-orange-500 dark:text-orange-300 italic">Gökay</span>.
      </h2>
      <p class="text-3xl font-caveat text-gray-700 dark:text-gray-300 mb-4">
        A full-stack web developer with a passion for creating functional
        applications.
      </p>
      <hr class="border-gray-300 dark:border-gray-600" />
    </div>
    <div
      class="flex flex-col md:grid md:grid-cols-2 mb-12 items-center md:items-start"
    >
      <!-- Profile Card (Stacks on Mobile, Aligns Left on Larger Screens) -->
      <LazyHomeProfileCard />

      <!-- Quick Links Grid -->
      <HomeQuickLinks :links="quickLinks" />
    </div>

    <div
      class="bg-white dark:bg-slate-900/60 rounded-2xl p-8 shadow-sm mb-12 doodle-border-another"
    >
      <h2
        class="text-4xl font-dancing-script font-bold text-primary-600 dark:text-stone-400 mb-4"
      >
        Currently
      </h2>
      <div
        class="space-y-4 font-short-stack text-l text-gray-700 dark:text-stone-500"
      >
        <p
          class="flex items-center gap-2"
          v-for="activity in activities"
          :key="activity.description"
        >
          <Icon
            :name="`${activity.icon}-bold`"
            class="text-primary-500 !w-5 !h-5"
          />
          {{ activity.description }}
        </p>
      </div>
    </div>
    <div
      class="bg-white dark:bg-slate-900/60 rounded-2xl p-8 shadow-sm doodle-border-another"
      v-if="hasLatestPosts"
    >
      <h2
        class="text-4xl font-dancing-script font-bold text-primary-600 dark:text-stone-400 mb-4"
      >
        Latest Posts
      </h2>
      <div class="space-y-4">
        <div
          v-for="post in processedPosts"
          :key="post.path"
          class="p-4 rounded-lg transition-colors duration-200 hover:doodle-border-another hover:bg-gray-50 hover:dark:bg-slate-900 hover:cursor-pointer"
          @click="post.navigationHandler"
        >
          <h3
            class="text-xl font-short-stack text-primary-600 dark:text-stone-500"
          >
            {{ post?.title }}
          </h3>
          <p
            class="font-caveat text-xl italic text-gray-600 dark:text-gray-400"
          >
            {{ post.formattedDate }} ago
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
