<script setup lang="ts">
import type { ProjectsCollectionItem } from "@nuxt/content";

import type { ProjectStatus, ProjectLink } from "@/../content.config.ts";
import { useSeo, useAsyncData, queryCollection } from "#imports";
import { computed } from "vue";
interface ProjectWithComputedData
  extends Omit<ProjectsCollectionItem, "description"> {
  readonly description: readonly string[];
  readonly statusClasses: string;
  readonly formattedLinks: readonly {
    readonly type: ProjectLink["type"];
    readonly url: string;
    readonly icon: string;
    readonly displayText: string;
  }[];
}

// --- functions ---

const getStatusClasses = (status: ProjectStatus): string => {
  const statusMap: Record<ProjectStatus, string> = {
    active: "bg-green-100 text-green-800",
    completed: "bg-blue-100 text-blue-800",
    maintained: "bg-purple-100 text-purple-800",
  };

  return statusMap[status] || "bg-gray-100 text-gray-800";
};

const getLinkIcon = (linkType: ProjectLink["type"]): string => {
  const iconMap: Record<ProjectLink["type"], string> = {
    github: "ph:github-logo",
    live: "ph:globe",
    demo: "ph:presentation-chart",
    "case-study": "ph:file-text",
    docs: "ph:file-text",
  };
  return iconMap[linkType];
};

const formatLinkText = (linkType: string): string => linkType.replace("-", " ");
const formatDescription = (description: string): string[] =>
  description
    .split("\\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

const transformProject = (
  project: ProjectsCollectionItem,
): ProjectWithComputedData => ({
  ...project,
  description: formatDescription(project.description || ""),
  statusClasses: getStatusClasses(project.status as ProjectStatus),
  formattedLinks: (project.links || []).map((link) => ({
    ...link,
    icon: getLinkIcon(link.type as ProjectLink["type"]),
    displayText: formatLinkText(link.type),
  })),
});

// --- data fetching ---
const { data: projects, status } = await useAsyncData("projects", () => {
  return queryCollection("projects").order("title", "DESC").all();
});

// --- composables ---
const shouldShowSkeleton = computed(() => {
  if (status.value === "pending") return true;

  return false;
});

const { setPageSeo } = useSeo();

// SEO Setup
setPageSeo({
  type: "website",
  title: "Projects & Experiments",
  description:
    "Explore my portfolio of web development projects and experiments.",
  keywords: [
    "projects",
    "portfolio",
    "web development",
    "full-stack",
    "open source",
    "experiments",
    "nuxt",
    "typescript",
    "react",
    "vue",
  ],
  url: "https://gokay.biz/projects",
  canonical: "/projects",
  image: {
    url: "/og-projects.png",
    alt: "Gökay Biz Projects - Development Portfolio",
    width: 1200,
    height: 630,
  },
});

const projectsWithFormattedData = computed(() =>
  (projects.value || []).map(transformProject),
);
</script>

<template>
  <div class="responsive-screen doodle">
    <fieldset class="doodle-border p-6 bg-white dark:bg-gray-900">
      <legend class="px-4">
        <h1
          class="text-4xl font-caveat font-bold text-[#3c3c3c] dark:text-white"
        >
          Projects & Experiments
        </h1>
      </legend>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <template v-if="shouldShowSkeleton">
          <div
            v-for="i in 4"
            :key="`skeleton-${i}`"
            class="break-inside-avoid rounded-xl bg-gray-100 dark:bg-gray-800 h-56 animate-pulse p-6"
          />
        </template>
        <div
          v-else-if="projectsWithFormattedData.length > 0"
          v-for="(project, index) in projectsWithFormattedData"
          :key="index"
          class="doodle-border-another p-6 rounded-xl bg-white dark:bg-gray-800 hover:shadow-lg transition-all duration-300 flex flex-col"
        >
          <div
            class="flex items-center justify-between mb-4 sm:flex-nowrap flex-wrap"
          >
            <h2
              class="text-2xl font-short-stack text-primary-600 dark:text-orange-300"
            >
              {{ project.title }}
            </h2>
            <span
              :class="project.statusClasses"
              class="px-3 py-1 rounded-full text-sm font-medium"
            >
              {{ project.status }}
            </span>
          </div>

          <div class="flex-1">
            <p
              class="text-gray-600 dark:text-gray-300 mb-2"
              v-for="description in project.description"
            >
              {{ description.trim() }}
            </p>
          </div>

          <div class="mt-auto">
            <div class="flex flex-wrap gap-2 mb-4">
              <span
                v-for="(tech, techIndex) in project.techs"
                :key="techIndex"
                class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-300"
              >
                {{ tech }}
              </span>
            </div>

            <div class="flex flex-col md:flex-row gap-3">
              <UtilLink
                v-for="(link, linkIndex) in project.formattedLinks"
                :key="linkIndex"
                :href="link.url"
                class="flex items-center px-4 py-2 doodle-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Icon :name="link.icon" class="!w-5 !h-5 mr-2" />
                <span class="capitalize">{{ link.displayText }}</span>
              </UtilLink>
            </div>
          </div>
        </div>
        <div v-else>
          <p class="text-gray-500 dark:text-gray-400">Hey!</p>
          <p class="text-gray-500 dark:text-gray-400">
            It looks like there is no projects yet.
          </p>
          <p class="text-gray-500 dark:text-gray-400">
            Check back later or explore my other sections.
          </p>
        </div>
      </div>
    </fieldset>
  </div>
</template>
