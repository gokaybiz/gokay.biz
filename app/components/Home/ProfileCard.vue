<script lang="ts" setup>
import { Effect, pipe, Schedule, Duration, Fiber, Option, Data } from "effect";
import type { Dayjs } from "dayjs";

// --- Types ---
interface PersonalIdentifier {
    readonly emoji: string;
    readonly pronouns: string;
    readonly zodiacSignEmoji: string;
    readonly zodiacSign: string;
}

interface TimeData {
    readonly localTime: string;
    readonly gmtOffset: string;
}

interface ProfileData {
    readonly identifier: PersonalIdentifier;
    readonly location: string;
    readonly avatarUrl: string;
    readonly currentTime: TimeData;
}

// Tagged error type for better error handling
class TimeUpdateError extends Data.TaggedError("TimeUpdateError")<{
    readonly message: string;
    readonly cause?: unknown;
}> {}

// --- Constants ---
const LOCATION = "Stockholm, Sweden" as const;
const AVATAR_URL = "https://github.com/gokaybiz.png" as const;
const TIME_UPDATE_INTERVAL = Duration.seconds(1);

const PERSONAL_IDENTIFIER: PersonalIdentifier = {
    emoji: "🌵",
    pronouns: "he/him",
    zodiacSignEmoji: "♐️",
    zodiacSign: "Sagittarius",
} as const;

// --- Functions ---
const createTimeData = (localTime: string, gmtOffset: string): TimeData => ({
    localTime,
    gmtOffset,
});

const createProfileData = (
    identifier: PersonalIdentifier,
    location: string,
    avatarUrl: string,
    currentTime: TimeData,
): ProfileData => ({
    identifier,
    location,
    avatarUrl,
    currentTime,
});

const formatTimeString = (datetime: Dayjs): string =>
    datetime.format("HH:mm:ss");

const formatGmtOffset = (datetime: Dayjs): string => {
    const offsetStr = datetime.format("Z");
    const gmtOffsetHours = Number.parseInt(offsetStr.substring(0, 3));
    return `GMT${gmtOffsetHours >= 0 ? "+" : ""}${gmtOffsetHours}`;
};

const createTimeEffect = (timezone: string) =>
    Effect.try({
        try: () => {
            const dayjs = useDayjs();
            const customDateTime = dayjs().tz(timezone);

            return createTimeData(
                formatTimeString(customDateTime),
                formatGmtOffset(customDateTime),
            );
        },
        catch: (error: unknown) =>
            new TimeUpdateError({
                message: "Failed to format time",
                cause: error,
            }),
    });

const createTimeUpdateEffect = (
    timezone: string,
    updateCallback: (timeData: TimeData) => void,
) =>
    pipe(
        createTimeEffect(timezone),
        Effect.tap((timeData) => Effect.sync(() => updateCallback(timeData))),
        Effect.catchAll((error: TimeUpdateError) =>
            Effect.logError(`Time update error: ${error.message}`).pipe(
                Effect.as(undefined),
            ),
        ),
    );

const createPeriodicTimeUpdater = (
    timezone: string,
    updateCallback: (timeData: TimeData) => void,
) =>
    pipe(
        createTimeUpdateEffect(timezone, updateCallback),
        Effect.schedule(Schedule.fixed(TIME_UPDATE_INTERVAL)),
        Effect.forkDaemon,
    );

// --- State Management ---
const timeData = ref<TimeData>(createTimeData("--:--:--", "GMT+0"));
const timeUpdateFiber = ref<
    Option.Option<Fiber.RuntimeFiber<unknown, unknown>>
>(Option.none());

// --- Computed Properties ---
const profileData = computed(
    (): ProfileData =>
        createProfileData(
            PERSONAL_IDENTIFIER,
            LOCATION,
            AVATAR_URL,
            timeData.value,
        ),
);

const profileItems = computed(() => [
    {
        id: "identity",
        icon: null,
        content: `${profileData.value.identifier.emoji} ${profileData.value.identifier.pronouns} • ${profileData.value.identifier.zodiacSignEmoji} ${profileData.value.identifier.zodiacSign}`,
    },
    {
        id: "location",
        icon: "📍",
        content: profileData.value.location,
    },
    {
        id: "time",
        icon: "⏲️",
        content: `${profileData.value.currentTime.localTime}${profileData.value.currentTime.gmtOffset ? ` (${profileData.value.currentTime.gmtOffset})` : ""}`,
    },
]);

// --- Side Effect Management ---
const updateTimeData = (newTimeData: TimeData): void => {
    timeData.value = newTimeData;
};

const initializeTime = (timezone: string) =>
    pipe(
        createTimeEffect(timezone),
        Effect.tap((initialTime) =>
            Effect.sync(() => updateTimeData(initialTime)),
        ),
        Effect.catchAll((error: TimeUpdateError) =>
            Effect.logError(
                `Time initialization failed: ${error.message}`,
            ).pipe(Effect.as(undefined)),
        ),
    );

const startTimeUpdates = (timezone: string) =>
    pipe(
        createPeriodicTimeUpdater(timezone, updateTimeData),
        Effect.map((fiber) => {
            timeUpdateFiber.value = Option.some(fiber);
            return fiber;
        }),
        Effect.catchAll((error: TimeUpdateError) =>
            Effect.logError(
                `Failed to start time updates: ${error.message}`,
            ).pipe(Effect.as(undefined)),
        ),
    );

const stopTimeUpdates = () =>
    Effect.sync(() => {
        Option.match(timeUpdateFiber.value, {
            onNone: () => {},
            onSome: (fiber) => Effect.runPromise(Fiber.interrupt(fiber)),
        });
        timeUpdateFiber.value = Option.none();
    });

// --- Lifecycle Management ---
const config = useRuntimeConfig();
const timezone = (config.public.timezone as string) || "UTC";

// Initialize time on component creation
Effect.runSync(initializeTime(timezone));

// Start time updates when component mounts
onMounted(() => {
    Effect.runSync(startTimeUpdates(timezone));
});

// Clean up when component unmounts
onUnmounted(() => {
    Effect.runSync(stopTimeUpdates());
});
</script>

<template>
    <div class="w-full flex justify-center md:justify-end md:pr-70 md:-mt-2">
        <div
            class="doodle-border-another p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-lg space-y-6 text-center text-l"
        >
            <!-- Avatar -->
            <div
                class="w-31 h-31 mx-auto rounded-full bg-gray-800 dark:bg-gray-700 flex items-center justify-center text-3xl"
            >
                <UtilImg
                    :src="profileData.avatarUrl"
                    :optimize="true"
                    alt="Photo of Gökay"
                    class="rounded-full w-30 h-30 object-cover bg-cover bg-center bg-stone-600 grayscale-45"
                />
            </div>

            <!-- Profile Information -->
            <div class="space-y-2">
                <p
                    v-for="item in profileItems"
                    :key="item.id"
                    class="text-gray-500 dark:text-gray-400"
                >
                    <span class="pr-0.5" v-if="item.icon"
                        >{{ item.icon }}
                    </span>
                    {{ item.content }}
                </p>
            </div>

            <!-- Social Links -->
            <SocialLinks class="justify-center mt-2" />
        </div>
    </div>
</template>
