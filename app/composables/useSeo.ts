import { Effect, pipe } from "effect";
import type {
  SeoData,
  SeoConfig,
  SeoMetaTags,
  OpenGraphData,
  TwitterCardData,
  StructuredData,
  ArticleSeoData,
  PersonSeoData,
  WebsiteSeoData,
  ProjectSeoData,
  SeoImage,
} from "~/types/seo";

const dayjs = useDayjs();

// Default SEO configuration
const createDefaultSeoConfig = (): SeoConfig => ({
  defaultTitle: "Gökay Biz - Full-Stack Developer",
  titleTemplate: "%s | Gökay Biz",
  defaultDescription:
    "A full-stack web developer with a passion for creating functional applications. Explore my blog, projects, and creative work.",
  defaultImage: {
    url: "/og-image.png",
    alt: "Gökay Biz - Full-Stack Developer",
    width: 1200,
    height: 630,
    type: "image/png",
  },
  siteUrl: "https://gokay.biz",
  siteName: "Gökay Biz",
  author: {
    type: "person",
    title: "Gökay Biz",
    description: "Full-Stack Web Developer",
    jobTitle: "Full-Stack Developer",
    organization: "Independent",
    sameAs: ["https://github.com/gokaybiz", "https://linkedin.com/in/gokaybiz"],
  },
  twitterHandle: "@gokaybiz",
  locale: "en_US",
});

// SEO reading time data transformation
const convertReadingTimeToISO8601 = (readingTime: string): string => {
  // Convert reading time string to ISO 8601 duration format (PnYnMnDTnHnMnS)
  const timeRegex =
    /(?:(\d+)\s*(?:year|years|yr|y))?(?:\s*(\d+)\s*(?:month|months|mo))?(?:\s*(\d+)\s*(?:day|days|d))?(?:\s*(\d+)\s*(?:hour|hours|hr|h))?(?:\s*(\d+)\s*(?:minute|minutes|min|m))?(?:\s*(\d+)\s*(?:second|seconds|sec|s))?/i;

  const match = readingTime.match(timeRegex);
  if (!match) return `PT${readingTime}`; // Fallback with PT prefix

  const [, years, months, days, hours, minutes, seconds] = match;

  let duration = "P";
  let hasDatePart = false;
  let hasTimePart = false;

  // Date part (years, months, days)
  if (years) {
    duration += `${years}Y`;
    hasDatePart = true;
  }
  if (months) {
    duration += `${months}M`;
    hasDatePart = true;
  }
  if (days) {
    duration += `${days}D`;
    hasDatePart = true;
  }

  // Time part (hours, minutes, seconds) - preceded by T
  if (hours || minutes || seconds) {
    duration += "T";
    hasTimePart = true;

    if (hours) {
      duration += `${hours}H`;
    }
    if (minutes) {
      duration += `${minutes}M`;
    }
    if (seconds) {
      duration += `${seconds}S`;
    }
  }

  // If no valid duration parts found, fallback to simple minute parsing
  if (!hasDatePart && !hasTimePart) {
    const simpleMatch = readingTime.match(/(\d+)/);
    if (simpleMatch) {
      return `PT${simpleMatch[1]}M`; // Default to minutes
    }
    return `PT${readingTime}`; // Ultimate fallback
  }

  return duration;
};

const createTitle = (title: string, config: SeoConfig): string =>
  title === config.defaultTitle
    ? title
    : config.titleTemplate.replace("%s", title);

const createCanonicalUrl = (path: string, config: SeoConfig): string =>
  `${config.siteUrl}${path.startsWith("/") ? path : `/${path}`}`;

const createImageUrl = (image: SeoImage, config: SeoConfig): SeoImage =>
  image.url.startsWith("http")
    ? image
    : { ...image, url: `${config.siteUrl}${image.url}` };

// Open Graph data generators
const createOpenGraphData = (
  seoData: SeoData,
  config: SeoConfig,
  currentPath: string,
): OpenGraphData => {
  const baseData = {
    title: createTitle(seoData.title, config),
    description: seoData.description,
    url: createCanonicalUrl(currentPath, config),
    siteName: config.siteName,
    locale: seoData.locale || config.locale,
    image: seoData.image
      ? createImageUrl(seoData.image, config)
      : createImageUrl(config.defaultImage, config),
  };

  switch (seoData.type) {
    case "article":
      return {
        ...baseData,
        type: "article",
        article: {
          publishedTime: seoData.publishedTime,
          modifiedTime: seoData.modifiedTime,
          author: seoData.author || config.author.title,
          section: seoData.section,
          tags: seoData.tags,
        },
      };
    case "person":
      return {
        ...baseData,
        type: "profile",
        profile: {
          firstName: seoData.title.split(" ")[0],
          lastName: seoData.title.split(" ").slice(1).join(" "),
          username: "gokaybiz",
        },
      };
    default:
      return {
        ...baseData,
        type: "website",
      };
  }
};

// Twitter Card data generator
const createTwitterCardData = (
  seoData: SeoData,
  config: SeoConfig,
): TwitterCardData => ({
  card: seoData.image ? "summary_large_image" : "summary",
  site: config.twitterHandle,
  creator: config.twitterHandle,
  title: createTitle(seoData.title, config),
  description: seoData.description,
  image: seoData.image
    ? createImageUrl(seoData.image, config)
    : createImageUrl(config.defaultImage, config),
});

// Structured data generators
const createWebsiteStructuredData = (config: SeoConfig): StructuredData => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: config.siteName,
  url: config.siteUrl,
  description: config.defaultDescription,
  author: {
    "@type": "Person",
    name: config.author.title,
    jobTitle: config.author.jobTitle,
    worksFor: {
      "@type": "Organization",
      name: config.author.organization,
    },
    sameAs: config.author.sameAs,
  },
});

const createArticleStructuredData = (
  seoData: ArticleSeoData,
  config: SeoConfig,
  currentPath: string,
): StructuredData => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: seoData.title,
  description: seoData.description,
  url: createCanonicalUrl(currentPath, config),
  datePublished: seoData.publishedTime,
  dateModified: seoData.modifiedTime,
  author: {
    "@type": "Person",
    name: seoData.author || config.author.title,
  },
  publisher: {
    "@type": "Person",
    name: config.author.title,
  },
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": createCanonicalUrl(currentPath, config),
  },
  keywords: seoData.tags?.join(", "),
  wordCount: seoData.wordCount,
  timeRequired: seoData.readingTime
    ? convertReadingTimeToISO8601(seoData.readingTime)
    : undefined,
});

const createPersonStructuredData = (
  seoData: PersonSeoData,
  config: SeoConfig,
): StructuredData => ({
  "@context": "https://schema.org",
  "@type": "Person",
  name: seoData.title,
  jobTitle: seoData.jobTitle,
  description: seoData.description,
  url: config.siteUrl,
  sameAs: seoData.sameAs || config.author.sameAs,
  worksFor: {
    "@type": "Organization",
    name: seoData.organization || config.author.organization,
  },
  address: seoData.location
    ? {
        "@type": "Place",
        name: seoData.location,
      }
    : undefined,
});

const createProjectStructuredData = (
  seoData: ProjectSeoData,
  config: SeoConfig,
  currentPath: string,
): StructuredData => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: seoData.title,
  description: seoData.description,
  url: createCanonicalUrl(currentPath, config),
  applicationCategory: "WebApplication",
  operatingSystem: "Any",
  author: {
    "@type": "Person",
    name: config.author.title,
  },
  programmingLanguage: seoData.technologies,
  codeRepository: seoData.githubUrl,
  installUrl: seoData.liveUrl,
  releaseNotes: seoData.status,
});

// Meta tags generator
const createMetaTags = (
  seoData: SeoData,
  config: SeoConfig,
  currentPath: string,
): SeoMetaTags => {
  const ogData = createOpenGraphData(seoData, config, currentPath);
  const twitterData = createTwitterCardData(seoData, config);
  const canonicalUrl = createCanonicalUrl(currentPath, config);

  const meta = [
    { name: "description", content: seoData.description, hid: "description" },
    {
      name: "author",
      content: seoData.author || config.author.title,
      hid: "author",
    },
    ...(seoData.keywords
      ? [
          {
            name: "keywords",
            content: seoData.keywords.join(", "),
            hid: "keywords",
          },
        ]
      : []),
    ...(seoData.noIndex
      ? [{ name: "robots", content: "noindex,nofollow", hid: "robots" }]
      : []),

    // Open Graph
    { property: "og:title", content: ogData.title, hid: "og:title" },
    {
      property: "og:description",
      content: ogData.description,
      hid: "og:description",
    },
    { property: "og:type", content: ogData.type, hid: "og:type" },
    { property: "og:url", content: ogData.url, hid: "og:url" },
    { property: "og:site_name", content: ogData.siteName, hid: "og:site_name" },
    { property: "og:locale", content: ogData.locale, hid: "og:locale" },

    // Twitter Card
    { name: "twitter:card", content: twitterData.card, hid: "twitter:card" },
    { name: "twitter:title", content: twitterData.title, hid: "twitter:title" },
    {
      name: "twitter:description",
      content: twitterData.description,
      hid: "twitter:description",
    },
    ...(config.twitterHandle
      ? [
          {
            name: "twitter:site",
            content: config.twitterHandle,
            hid: "twitter:site",
          },
          {
            name: "twitter:creator",
            content: config.twitterHandle,
            hid: "twitter:creator",
          },
        ]
      : []),
  ];

  // Add image meta tags if present
  if (ogData.image) {
    meta.push(
      { property: "og:image", content: ogData.image.url, hid: "og:image" },
      {
        property: "og:image:alt",
        content: ogData.image.alt,
        hid: "og:image:alt",
      },
      {
        name: "twitter:image",
        content: ogData.image.url,
        hid: "twitter:image",
      },
      {
        name: "twitter:image:alt",
        content: ogData.image.alt,
        hid: "twitter:image:alt",
      },
    );

    if (ogData.image.width && ogData.image.height) {
      meta.push(
        {
          property: "og:image:width",
          content: ogData.image.width.toString(),
          hid: "og:image:width",
        },
        {
          property: "og:image:height",
          content: ogData.image.height.toString(),
          hid: "og:image:height",
        },
      );
    }
  }

  // Add article-specific meta tags
  if (ogData.type === "article" && ogData.article) {
    if (ogData.article.publishedTime) {
      meta.push({
        property: "article:published_time",
        content: ogData.article.publishedTime,
        hid: "article:published_time",
      });
    }
    if (ogData.article.modifiedTime) {
      meta.push({
        property: "article:modified_time",
        content: ogData.article.modifiedTime,
        hid: "article:modified_time",
      });
    }
    if (ogData.article.author) {
      meta.push({
        property: "article:author",
        content: ogData.article.author,
        hid: "article:author",
      });
    }
    if (ogData.article.section) {
      meta.push({
        property: "article:section",
        content: ogData.article.section,
        hid: "article:section",
      });
    }
    ogData.article.tags?.forEach((tag, index) => {
      meta.push({
        property: "article:tag",
        content: tag,
        hid: `article:tag:${index}`,
      });
    });
  }

  const link = [{ rel: "canonical", href: canonicalUrl, hid: "canonical" }];

  return {
    title: createTitle(seoData.title, config),
    meta,
    link,
  };
};

// Effect-based SEO data processing
const createSeoEffect = (
  seoData: SeoData,
  currentPath: string,
  config: SeoConfig = createDefaultSeoConfig(),
) =>
  pipe(
    Effect.succeed({ seoData, currentPath, config }),
    Effect.map(({ seoData, currentPath, config }) => ({
      metaTags: createMetaTags(seoData, config, currentPath),
      structuredData: createStructuredDataForType(seoData, config, currentPath),
      openGraph: createOpenGraphData(seoData, config, currentPath),
      twitterCard: createTwitterCardData(seoData, config),
    })),
  );

const createStructuredDataForType = (
  seoData: SeoData,
  config: SeoConfig,
  currentPath: string,
): StructuredData => {
  switch (seoData.type) {
    case "article":
      return createArticleStructuredData(seoData, config, currentPath);
    case "person":
      return createPersonStructuredData(seoData, config);
    case "project":
      return createProjectStructuredData(seoData, config, currentPath);
    case "photo":
    case "music":
    case "website":
      return createWebsiteStructuredData(config);
    default:
      return createWebsiteStructuredData(config);
  }
};

// Main composable
export const useSeo = () => {
  const route = useRoute();
  const config = createDefaultSeoConfig();

  const applySeo = (seoData: SeoData) => {
    const currentPath = route.path;

    return Effect.runSync(createSeoEffect(seoData, currentPath, config));
  };

  const setPageSeo = (seoData: SeoData) => {
    const result = applySeo(seoData);

    // Apply meta tags using Nuxt's useSeoMeta
    useSeoMeta({
      title: result.metaTags.title,
      description: seoData.description,
      ogTitle: result.openGraph.title,
      ogDescription: result.openGraph.description,
      ogType: result.openGraph.type,
      ogUrl: result.openGraph.url,
      ogSiteName: result.openGraph.siteName,
      ogLocale: result.openGraph.locale,
      ogImage: result.openGraph.image?.url,
      ogImageAlt: result.openGraph.image?.alt,
      ogImageWidth: result.openGraph.image?.width,
      ogImageHeight: result.openGraph.image?.height,
      twitterCard: result.twitterCard.card,
      twitterSite: result.twitterCard.site,
      twitterCreator: result.twitterCard.creator,
      twitterTitle: result.twitterCard.title,
      twitterDescription: result.twitterCard.description,
      twitterImage: result.twitterCard.image?.url,
      twitterImageAlt: result.twitterCard.image?.alt,
    });

    // Apply additional head tags using useHead
    useHead({
      meta: result.metaTags.meta,
      link: result.metaTags.link,
      script: [
        {
          type: "application/ld+json",
          innerHTML: JSON.stringify(result.structuredData),
          key: "structured-data",
        },
      ],
    });

    return result;
  };

  // Helper functions for different content types
  const createHomepageSeo = (): WebsiteSeoData => ({
    type: "website",
    title: config.defaultTitle,
    description: config.defaultDescription,
    url: config.siteUrl,
    author: config.author.title,
    siteName: config.siteName,
    image: config.defaultImage,
    canonical: config.siteUrl,
  });

  const createArticleSeo = (article: {
    title: string;
    description: string;
    publishedTime?: string;
    modifiedTime?: string;
    tags?: string[];
    readingTime?: string;
    wordCount?: number;
  }): ArticleSeoData => ({
    type: "article",
    title: article.title,
    description: article.description,
    author: config.author.title,
    publishedTime: article.publishedTime,
    modifiedTime: article.modifiedTime,
    tags: article.tags,
    readingTime: article.readingTime,
    wordCount: article.wordCount,
    section: "Blog",
    image: config.defaultImage,
  });

  const createProjectSeo = (project: {
    title: string;
    description: string;
    technologies?: string[];
    githubUrl?: string;
    liveUrl?: string;
    status?: "active" | "completed" | "archived";
  }): ProjectSeoData => ({
    type: "project",
    title: project.title,
    description: project.description,
    author: config.author.title,
    technologies: project.technologies,
    githubUrl: project.githubUrl,
    liveUrl: project.liveUrl,
    status: project.status || "completed",
    image: config.defaultImage,
  });

  return {
    setPageSeo,
    applySeo,
    createHomepageSeo,
    createArticleSeo,
    createProjectSeo,
    config,
  };
};

// Export helper functions for standalone use
export {
  createDefaultSeoConfig,
  createTitle,
  createCanonicalUrl,
  createOpenGraphData,
  createTwitterCardData,
  createMetaTags,
};
