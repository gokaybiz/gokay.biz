<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps<{
    error: NuxtError;
}>();

const { setHideNavbar } = useNavbar();

setHideNavbar(false); //Navbar is always on error pages

//Same Layout as normal pages:
if (import.meta.client) {
    setPageLayout("default");
}

const statusCode = computed(() => props.error?.statusCode ?? "Error");
const message = computed(() => props.error?.message ?? "Something went wrong.");
</script>

<template>
    <NuxtLayout>
        <div class="content text-center mx-auto mt-10 text-xl">
            <h1>{{ statusCode }}</h1>
            <h2>Uh-Oh!</h2>
            <p>
                {{ message }}
            </p>
            <NuxtLink class="text-orange-400" to="/">Go back home</NuxtLink>
        </div>
    </NuxtLayout>
</template>
