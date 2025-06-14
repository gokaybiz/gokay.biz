<script setup lang="ts">
import { NuxtLink } from "#components";
import { useRuntimeConfig } from "#app";
import { useAttrs, computed } from "vue";

// --- Types ---
type Href = string;
type Target =
    | "_blank"
    | "_parent"
    | "_self"
    | "_top"
    | (string & object)
    | null
    | undefined;

type LinkType =
    | { readonly type: "internal"; readonly path: Href }
    | { readonly type: "external"; readonly url: Href }
    | { readonly type: "none" };

interface Props {
    href: Href;
    target?: Target;
    internal?: boolean;
    external?: boolean;
    title?: string | null;
    utm?: boolean;
}

interface ProcessedLink {
    readonly linkType: LinkType;
    readonly finalUrl: Href;
    readonly shouldShowInternal: boolean;
    readonly shouldShowExternal: boolean;
}

// --- Props ---
const props = withDefaults(defineProps<Props>(), {
    href: "",
    target: undefined,
    internal: false,
    external: false,
    title: null,
    utm: true,
});

const attrs = useAttrs();
const config = useRuntimeConfig();

// --- Constants ---
const DEFAULT_EXTERNAL_TARGET = "_blank";
const UTM_SOURCE = "gokay.biz";

// --- Functions ---
const createInternalLink = (path: Href): LinkType => ({
    type: "internal",
    path,
});

const createExternalLink = (url: Href): LinkType => ({
    type: "external",
    url,
});

const createNoneLink = (): LinkType => ({
    type: "none",
});

const isInternalPath = (href: Href): boolean => {
    if (!href) return false;
    const firstChar = href[0];
    if (firstChar === "/" || firstChar === "#") return true;

    if (/^https?:\/\//.test(href)) {
        try {
            return (
                new URL(href).hostname ===
                new URL(config.public.siteUrl as string).hostname
            );
        } catch {
            return false;
        }
    }

    return true;
};

const determineLinkType = (
    href: Href,
    forceInternal?: boolean,
    forceExternal?: boolean,
): LinkType => {
    if (!href) return createNoneLink();
    if (forceInternal) return createInternalLink(href);
    if (forceExternal) return createExternalLink(href);

    return isInternalPath(href)
        ? createInternalLink(href)
        : createExternalLink(href);
};

const addUtmToUrl = (url: Href): Href => {
    try {
        const parsedUrl = new URL(url);
        parsedUrl.searchParams.append("utm_source", UTM_SOURCE);
        return parsedUrl.href;
    } catch {
        return url;
    }
};

const getExternalTarget = (specifiedTarget?: Target): string =>
    specifiedTarget && typeof specifiedTarget === "string"
        ? specifiedTarget
        : DEFAULT_EXTERNAL_TARGET;

const shouldAddUtm = (linkType: LinkType, utmEnabled: boolean): boolean =>
    linkType.type === "external" && utmEnabled;

const processUrl = (
    href: Href,
    linkType: LinkType,
    utmEnabled: boolean,
): Href => (shouldAddUtm(linkType, utmEnabled) ? addUtmToUrl(href) : href);

const processLink = (
    href: Href,
    internal?: boolean,
    external?: boolean,
    utm?: boolean,
): ProcessedLink => {
    const linkType = determineLinkType(href, internal, external);
    const finalUrl = processUrl(href, linkType, utm ?? true);

    return {
        linkType,
        finalUrl,
        shouldShowInternal: linkType.type === "internal",
        shouldShowExternal: linkType.type === "external",
    };
};

const createInternalLinkProps = (
    href: Href,
    target?: Target,
    title?: string | null,
) => ({
    to: href,
    target: target,
    title: title ?? undefined,
    ...attrs,
});

const createExternalLinkProps = (
    url: Href,
    target?: Target,
    title?: string | null,
) => ({
    href: url,
    target: getExternalTarget(target),
    title: title ?? undefined,
    rel: "noreferrer noopener nofollow",
    ...attrs,
});

// --- Computed Properties ---
const processedLink = computed(
    (): ProcessedLink =>
        processLink(props.href, props.internal, props.external, props.utm),
);

const internalLinkProps = computed(() =>
    createInternalLinkProps(props.href, props.target, props.title),
);

const externalLinkProps = computed(() =>
    createExternalLinkProps(
        processedLink.value.finalUrl,
        props.target,
        props.title,
    ),
);
</script>

<template>
    <NuxtLink
        v-if="processedLink.shouldShowInternal"
        v-bind="internalLinkProps"
    >
        <slot />
    </NuxtLink>

    <a v-else-if="processedLink.shouldShowExternal" v-bind="externalLinkProps">
        <slot />
    </a>
</template>
