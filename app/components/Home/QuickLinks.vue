<script lang="ts" setup>
defineProps({
    links: Array as () => { title: string; to: string; icon: string }[],
});
</script>

<template>
    <div
        class="grid grid-cols-2 w-full gap-8 mt-10 md:w-auto md:grid-cols-3 md:gap-7 md:mt-0 md:-ml-60 md:pr-8"
    >
        <NuxtLink
            v-for="link in links"
            :key="link.title"
            :to="link.to"
            class="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-center group md:odd:rotate-4 md:even:-rotate-4 hover:scale-105 md:hover:rotate-0 doodle-border"
        >
            <div
                class="text-4xl mb-2 group-hover:scale-110 transition-transform duration-200"
            >
                <Icon :name="`${link.icon}-thin`" class="!w-12 !h-12" />
            </div>
            <div class="font-caveat text-2xl text-gray-700 dark:text-gray-300">
                {{ link.title }}
            </div>
        </NuxtLink>
    </div>
</template>
