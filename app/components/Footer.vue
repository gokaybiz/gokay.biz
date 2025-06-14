<template>
    <footer
        class="bg-gradient-to-b from-orange-200 to-sky-100 text-sm w-full py-4 pt-8 text-black/50 dark:from-[#23272e] dark:to-[#3a2323] dark:text-white/40 footer"
    >
        <div class="responsive-screen">
            <div
                class="text-center sm:text-left space-y-4 sm:space-y-0 sm:space-x-6"
            >
                <div class="grid grid-cols-2 gap-2">
                    <p>
                        ©2025 Gokay.Biz/ — Sharing ideas and building in
                        public.
                    </p>
                    <p>
                        All content is open for learning and remixing. Please
                        attribute when sharing or adapting.
                    </p>
                    <p>
                        Crafted with
                        <Icon
                            name="ph-coffee-fill"
                            class="!w-4 !h-4 text-orange-400 dark:text-orange-300"
                        />
                        and
                        <Icon
                            name="ph-heart-fill"
                            class="!w-4 !h-4 text-red-400 dark:text-red-300"
                        />
                        using modern web technologies.
                    </p>
                    <span>
                        Want to collaborate, contribute, or just say hi?
                        <NuxtLink
                            to="https://github.com/gokaybiz"
                            target="_blank"
                            class="border-b border-transparent hover:border-black/10 dark:hover:border-white/10 transition-colors"
                        >
                            Visit the GitHub repo
                        </NuxtLink>
                        or
                        <NuxtLink
                            to="/contact"
                            class="border-b border-transparent hover:border-black/10 dark:hover:border-white/10 transition-colors"
                        >
                            send a message?
                        </NuxtLink>
                        .
                    </span>
                </div>
            </div>
        </div>
    </footer>
</template>

<style scoped>
.footer {
    mask: var(--wiggleup);
}
</style>
