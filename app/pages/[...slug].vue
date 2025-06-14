<script setup lang="ts">
import {
    definePageMeta,
    useNormalizePath,
    useAsyncData,
    queryCollection,
} from "#imports";
import { useRoute, useRouter } from "vue-router";
import ContentLayout from "~/layouts/ContentLayout.vue";

definePageMeta({
    pageTransition: {
        name: "page",
        mode: "out-in",
    },
});

const route = useRoute();
const router = useRouter();
const normalizePath = useNormalizePath();

const { data: page } = await useAsyncData(
    `page-${normalizePath(route.path)}`,
    () => {
        return queryCollection("pages")
            .path(`/pages${normalizePath(route.path)}`)
            .first();
    },
);

if (!page.value) {
    router.replace("/404");
}
</script>

<template>
    <div v-if="page">
        <ContentLayout :page="page" :hide-toh="true">
            <ContentRenderer :value="page" />
        </ContentLayout>
    </div>
</template>
