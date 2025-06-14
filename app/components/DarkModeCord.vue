<script setup lang="ts">
import { type Ref, ref } from "vue";

type Height = number;
type ChainState = {
    readonly displayHeight: Height;
    readonly realHeight: Height;
    readonly isExpanding: boolean;
};

const props = defineProps<{
    initialHeight?: Height;
    realHeight?: Height;
    event?: () => void;
}>();

const INITIAL_HEIGHT: Height = props.initialHeight || 190;
const REAL_HEIGHT: Height = props.realHeight || 240;
const RESET_DELAY: number = 200;
const ANIMATION_DURATION: number = 500;

// State
const chainState: Ref<ChainState> = ref({
    displayHeight: INITIAL_HEIGHT,
    realHeight: REAL_HEIGHT,
    isExpanding: false,
});

const expand = (state: ChainState): ChainState => ({
    ...state,
    displayHeight: state.realHeight,
    isExpanding: true,
});

const contract = (state: ChainState): ChainState => ({
    ...state,
    displayHeight: INITIAL_HEIGHT,
    isExpanding: false,
});

const updateState = (stateFn: (s: ChainState) => ChainState): void => {
    chainState.value = stateFn(chainState.value);
};

const handleClick = (): void => {
    const expandChain = () => updateState(expand);
    const contractChain = () => updateState(contract);

    expandChain();
    props.event?.();
    setTimeout(contractChain, RESET_DELAY);
};
</script>

<template>
    <div
        class="block right-2 md:right-10 lg:right-35 w-4 fixed top-0 z-index-3"
    >
        <div
            class="border-l-2 border-dotted border-gray-700 dark:border-slate-500 overflow-hidden"
            :style="{
                height: `${chainState.displayHeight}px`,
                transition: `height ${ANIMATION_DURATION}ms ease-out`,
            }"
        ></div>
        <div
            @click="handleClick"
            class="cursor-pointer bg-gray-700 dark:bg-slate-600 w-[15px] h-[15px] rounded-full relative -left-[6px]"
        ></div>
    </div>
</template>
