<script setup>
import { useNavbar } from "~/composables/useNavbar";
const { isNavbarVisible } = useNavbar();
</script>

<template>
    <div
        class="min-h-window dark:from-[#23272e] dark:to-[#3a2323] bg-linear-to-b from-[#D6EEFF] to-[#FFE6D6]"
    >
        <Navbar :routeIsHome="isNavbarVisible" />

        <main class="responsive-screen min-h-screen pb-6 min-w-full content">
            <slot />
        </main>

        <Footer />
    </div>
</template>
