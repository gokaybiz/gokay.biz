<script setup lang="ts">
import Logo from "~/assets/images/logo.svg";

type NavLink = Readonly<{
    title: string;
    to: string;
    emoji: string;
}>;

defineProps({
    routeIsHome: {
        type: Boolean,
        default: false,
    },
});

const navLinks: ReadonlyArray<NavLink> = [
    { title: "Blog", to: "/blog", emoji: "📝" },
    { title: "About", to: "/about", emoji: "🌿" },
    { title: "Projects", to: "/projects", emoji: "🛠️" },
    { title: "Photos", to: "/photos", emoji: "📷" },
    { title: "Contact", to: "/contact", emoji: "📧" },
    { title: "Songs", to: "/songs", emoji: "🎧" },
];

const toggleDarkMode = useDarkMode();
</script>
<template>
    <Transition name="bounce" type="animation">
        <header
            v-if="routeIsHome"
            class="w-full bg-orange-200 dark:bg-gray-900 shadow-sm px-4 sm:px-6 md:px-16 lg:px-24 py-3 flex flex-wrap justify-between items-center mb-3"
        >
            <!-- Logo -->
            <UtilLink href="/" class="flex items-center pb-3 md:pb-0">
                <span class="sr-only">Homepage</span>

                <Logo
                    class="text-neutral rounded-md bg-orange-50 dark:bg-slate-800 dark:text-sky-200 transition-transform hover:-rotate-6 flex-shrink-0 pl-1 pr-3 h-17 w-24"
                />
            </UtilLink>

            <!-- Navigation -->
            <nav aria-label="Main Navigation">
                <ul
                    class="flex flex-wrap justify-center space-x-2 sm:space-x-4 md:space-x-6 text-xs sm:text-sm md:text-base"
                >
                    <li
                        v-for="link in navLinks"
                        :key="link.title"
                        class="flex items-center space-x-1 text-gray-800 dark:text-gray-200 hover:text-orange-500 transition"
                    >
                        <span class="text-base sm:text-lg md:text-xl">{{
                            link.emoji
                        }}</span>
                        <NuxtLink :to="link.to">{{ link.title }}</NuxtLink>
                    </li>
                </ul>
            </nav>

            <!-- Dark Mode Toggle -->
            <div
                class="absolute flex flex-row justify-end gap-3 md:top-6 top-3 right-8 md:right-auto md:left-50"
            >
                <button
                    @click="toggleDarkMode"
                    class="p-3 md:p-2 mt-1 md:mt-0 rounded-full bg-gray-200 dark:bg-gray-800"
                >
                    <Icon
                        name="ph:moon-stars-bold"
                        class="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-700 dark:text-gray-300 mt-1 mx-1"
                    />
                </button>
            </div>
        </header>
    </Transition>
</template>
