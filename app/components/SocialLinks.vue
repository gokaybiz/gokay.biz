<script setup lang="ts">
type SocialPlatform = "github" | "linkedin" | "email";

interface SocialLink {
    name: SocialPlatform;
    url: string;
    icon: string;
}

const socialLinks: SocialLink[] = [
    {
        name: "github",
        url: "https://github.com/gokaybiz",
        icon: "ph-github-logo",
    },
    {
        name: "linkedin",
        url: "https://www.linkedin.com/in/gokaybiz/",
        icon: "ph-linkedin-logo",
    },
    {
        name: "email",
        url: "mailto:gkymhmt@gmail.com",
        icon: "ph-envelope",
    },
];

// Social icon color mapping
const socialColorMap: Record<string, string> = {
    github: "text-black-500",
    linkedin: "text-blue-500",
    email: "text-slate-400",
};

// Get color for social icon
const getSocialIconColor = (name: SocialPlatform): string => {
    const defaultColor = "text-zinc-600";

    return socialColorMap[name] ?? defaultColor;
};
</script>

<template>
    <div class="inline-flex gap-2 text-2xl">
        <template v-for="social in socialLinks" :key="social.name">
            <UtilLink
                :href="social.url"
                :blank="true"
                :class="`${getSocialIconColor(social.name)} w-6 h-6`"
            >
                <Icon :name="social.icon" class="!w-6 !h-6" />
            </UtilLink>
        </template>
    </div>
</template>
