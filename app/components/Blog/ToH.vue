<script setup lang="ts">
import type { Toc, TocLink } from "@nuxtjs/mdc";
import { type PropType, ref, computed } from "vue";
import { useRoute } from "vue-router";

// --- Types ---
interface TocState {
    readonly isOpen: boolean;
    readonly expandedItems: readonly string[];
}

interface ProcessedTocLink extends TocLink {
    readonly isActive: boolean;
    readonly hasChildren: boolean;
    readonly isExpanded: boolean;
    readonly toggleHandler: () => void;
    readonly iconName: string;
}

interface ProcessedChildLink extends TocLink {
    readonly isActive: boolean;
}

// --- Props ---
const props = defineProps({
    tocData: {
        type: Object as PropType<Toc>,
        required: true,
        default: () => ({
            title: "",
            links: [],
        }),
    },
});

// --- Constants ---
const CARET_ICONS = {
    collapsed: "ph-caret-right",
    expanded: "ph-caret-down",
} as const;

// --- State ---
const route = useRoute();
const tocState = ref<TocState>({
    isOpen: false,
    expandedItems: [],
});

// --- Functions ---
const createTocState = (
    isOpen: boolean,
    expandedItems: readonly string[] = [],
): TocState => ({
    isOpen,
    expandedItems,
});

const toggleTocOpen = (currentState: TocState): TocState =>
    createTocState(!currentState.isOpen, currentState.expandedItems);

const toggleItemExpansion = (
    currentState: TocState,
    itemId: string,
): TocState => {
    const isCurrentlyExpanded = currentState.expandedItems.includes(itemId);
    const newExpandedItems = isCurrentlyExpanded
        ? currentState.expandedItems.filter((id) => id !== itemId)
        : [...currentState.expandedItems, itemId];

    return createTocState(currentState.isOpen, newExpandedItems);
};

const isLinkActive = (linkId: string, currentHash: string): boolean =>
    currentHash === `#${linkId}`;

const hasChildLinks = (link: TocLink): boolean =>
    Boolean(link.children && link.children.length > 0);

const isItemExpanded = (
    itemId: string,
    expandedItems: readonly string[],
): boolean => expandedItems.includes(itemId);

const getCaretIcon = (isExpanded: boolean): string =>
    isExpanded ? CARET_ICONS.expanded : CARET_ICONS.collapsed;

const createLinkHref = (linkId: string): string => `#${linkId}`;

const processChildLink = (
    child: TocLink,
    currentHash: string,
): ProcessedChildLink => ({
    ...child,
    isActive: isLinkActive(child.id, currentHash),
});

const processMainLink = (
    link: TocLink,
    currentHash: string,
    expandedItems: readonly string[],
    toggleHandler: (id: string) => void,
): ProcessedTocLink => {
    const isActive = isLinkActive(link.id, currentHash);
    const hasChildren = hasChildLinks(link);
    const isExpanded = isItemExpanded(link.id, expandedItems);

    return {
        ...link,
        isActive,
        hasChildren,
        isExpanded,
        toggleHandler: () => toggleHandler(link.id),
        iconName: getCaretIcon(isExpanded),
    };
};

const processChildLinks = (
    children: TocLink[] | undefined,
    currentHash: string,
): readonly ProcessedChildLink[] => {
    if (!children) return [];
    return children.map((child) => processChildLink(child, currentHash));
};

// --- Event Handlers ---
const createTocToggleHandler = () => () => {
    tocState.value = toggleTocOpen(tocState.value);
};

const createItemToggleHandler = () => (itemId: string) => {
    tocState.value = toggleItemExpansion(tocState.value, itemId);
};

// --- Computed Properties ---
const currentHash = computed(() => route.hash);

const hasTocLinks = computed(
    () => props.tocData.links && props.tocData.links.length > 0,
);

const toggleTocHandler = computed(() => createTocToggleHandler());
const toggleItemHandler = computed(() => createItemToggleHandler());

const processedTocLinks = computed((): readonly ProcessedTocLink[] =>
    props.tocData.links.map((link) =>
        processMainLink(
            link,
            currentHash.value,
            tocState.value.expandedItems,
            toggleItemHandler.value,
        ),
    ),
);

const tocToggleIcon = computed(() => getCaretIcon(tocState.value.isOpen));

const linkDataForTemplate = computed(() =>
    processedTocLinks.value.map((link) => ({
        ...link,
        children: processChildLinks(link.children, currentHash.value),
        shouldShowChildren: link.hasChildren && link.isExpanded,
    })),
);
</script>

<template>
    <div v-show="hasTocLinks" class="rounded-md flex flex-col space-y-2 mb-6">
        <!-- Toggle Button -->
        <div
            class="cursor-pointer flex font-medium space-x-1 transition-colors text-gray-500 items-center dark:text-dark-100 hover:text-gray-700 dark:hover:text-white/40 select-none"
            @click="toggleTocHandler"
        >
            <h1 class="uppercase underline">Table of Contents</h1>
            <Icon
                :name="tocToggleIcon"
                class="!h-4 !w-4 transition-transform duration-200"
                :class="{ 'rotate-90': tocState.isOpen }"
                aria-hidden="true"
            />
        </div>

        <!-- TOC Content -->
        <div
            v-show="tocState.isOpen"
            class="px-12 flex max-w-auto md:max-w-6/12 doodle-border mb-2"
        >
            <ul class="flex flex-col gap-y-2">
                <li
                    v-for="linkData in linkDataForTemplate"
                    :key="linkData.id"
                    class="group"
                >
                    <!-- Primary Link -->
                    <div class="flex items-center">
                        <!-- Expand/Collapse Icon -->
                        <span
                            v-if="linkData.hasChildren"
                            class="mr-1 text-gray-500 hover:text-gray-600 dark:hover:text-white/60 transition-colors hover:cursor-pointer"
                            @click="linkData.toggleHandler"
                        >
                            <Icon
                                :name="linkData.iconName"
                                class="!h-3 !w-3 transition-transform duration-200"
                                :class="{ 'rotate-90': linkData.isExpanded }"
                            />
                        </span>

                        <!-- Main Link -->
                        <a
                            :href="createLinkHref(linkData.id)"
                            class="text-gray-500 hover:text-gray-700 dark:text-dark-100 dark:hover:text-white/40 transition-colors"
                            :class="{ 'font-medium': !linkData.isActive }"
                        >
                            {{ linkData.text }}
                        </a>
                    </div>

                    <!-- Child Links -->
                    <ul
                        v-if="linkData.shouldShowChildren"
                        class="pl-4 mt-1 space-y-1"
                    >
                        <li v-for="child in linkData.children" :key="child.id">
                            <a
                                :href="createLinkHref(child.id)"
                                class="text-sm text-gray-500 hover:text-gray-700 dark:text-dark-100 dark:hover:text-white/40 transition-colors"
                                :class="{ 'font-medium': !child.isActive }"
                            >
                                {{ child.text }}
                            </a>
                        </li>
                    </ul>
                </li>
            </ul>
        </div>
    </div>
</template>

<style scoped>
.rotate-90 {
    transform: rotate(90deg);
}
</style>
