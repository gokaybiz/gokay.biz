<script setup lang="ts">
// --- Types ---
const NOTIFICATION_TYPES = ["info", "success", "warning", "error"] as const;
type NotificationType = (typeof NOTIFICATION_TYPES)[number];

interface NotificationConfig {
    readonly iconName: string;
    readonly borderClasses: string;
    readonly iconClasses: string;
}

interface Notification {
    readonly type: NotificationType;
    readonly title: string;
    readonly config: NotificationConfig;
    readonly containerClasses: string;
}

// --- Props ---
const props = defineProps<{
    type?: NotificationType;
    title?: string;
    prose?: boolean;
}>();

// --- Constants ---
const THEME_MAPPING: Record<NotificationType, NotificationConfig> = {
    info: {
        iconName: "ph:lightbulb",
        borderClasses: "border-blue-400 dark:border-blue-300",
        iconClasses: "text-blue-400 dark:text-blue-300",
    },
    success: {
        iconName: "ph:check-circle",
        borderClasses: "border-green-400 dark:border-green-300",
        iconClasses: "text-green-400 dark:text-green-300",
    },
    warning: {
        iconName: "ph:warning-circle",
        borderClasses: "border-yellow-400 dark:border-yellow-300",
        iconClasses: "text-yellow-400 dark:text-yellow-300",
    },
    error: {
        iconName: "ph:seal-warning",
        borderClasses: "border-red-400 dark:border-red-300",
        iconClasses: "text-red-400 dark:text-red-300",
    },
} as const;

const DEFAULT_TYPE: NotificationType = "warning";

// --- Functions ---
const getNotificationType = (type?: NotificationType): NotificationType =>
    type ?? DEFAULT_TYPE;

const getNotificationTitle = (
    title?: string,
    type?: NotificationType,
): string => title ?? type ?? DEFAULT_TYPE;

const getNotificationConfig = (type: NotificationType): NotificationConfig =>
    THEME_MAPPING[type];

const createContainerClasses = (
    config: NotificationConfig,
    prose: boolean,
): string => {
    const baseClasses =
        "bg-white/70 dark:bg-gray-900/80 rounded-xl px-3 py-2 mb-6 font-short-stack relative border-2 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.01] doodle-border-another";
    const proseClass = prose ? "" : "not-prose";

    return `${baseClasses} ${config.borderClasses} ${proseClass}`.trim();
};

const processNotification = (
    type?: NotificationType,
    title?: string,
    prose?: boolean,
): Notification => {
    const notificationType = getNotificationType(type);
    const notificationTitle = getNotificationTitle(title, type);
    const config = getNotificationConfig(notificationType);

    return {
        type: notificationType,
        title: notificationTitle,
        config,
        containerClasses: createContainerClasses(config, prose ?? false),
    };
};

// --- Computed Properties ---
const processedNotification = computed(
    (): Notification =>
        processNotification(props.type, props.title, props.prose),
);
</script>

<template>
    <div :class="processedNotification.containerClasses">
        <div class="flex items-center gap-3 mb-2">
            <Icon
                :name="processedNotification.config.iconName"
                class="w-6 h-6"
                :class="processedNotification.config.iconClasses"
            />
            <span
                class="font-caveat text-xl font-bold text-stone-700 dark:text-white/80 first-letter:uppercase"
            >
                {{ processedNotification.title }}
            </span>
        </div>
        <div
            class="text-base text-gray-700 dark:text-gray-200 font-short-stack"
        >
            <slot />
        </div>
    </div>
</template>
