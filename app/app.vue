<script setup lang="ts">
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
