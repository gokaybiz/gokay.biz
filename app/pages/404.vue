<script setup lang="ts">
import { useSeo } from "#imports";

const { setPageSeo } = useSeo();
setPageSeo({
    type: "website",
    title: "Page Not Found",
    description:
        "The page you're looking for doesn't exist. Explore other sections of Gökay Biz website.",
    url: "https://gokay.biz/404",
    noIndex: true,
    noFollow: true,
    canonical: "/404",
});
</script>
<template>
    <div class="flex items-center justify-center">
        <div class="text-center">
            <h1 class="text-4xl font-bold mb-4">404 - Page Not Found</h1>
            <p class="text-gray-600 mb-8">
                The page you're looking for doesn't exist.
            </p>
            <NuxtLink
                to="/"
                class="border-1 border-orange-900 bg-orange-200 text-orange-800 px-6 py-2 rounded hover:bg-orange-300"
            >
                Go Home
            </NuxtLink>
        </div>
    </div>
</template>
