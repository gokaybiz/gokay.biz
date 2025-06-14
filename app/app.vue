<script setup lang="ts">
import { useNavbar } from "#imports";
import { computed, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const { setHideNavbar } = useNavbar();

const isHomeRoute = computed(() => route.path === "/");

watch(isHomeRoute, setHideNavbar, { immediate: true });
</script>

<template>
    <div>
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </div>
</template>
