export interface BaseSeoData {
  readonly title: string;
  readonly description: string;
  readonly keywords?: readonly string[];
  readonly author?: string;
  readonly canonical?: string;
  readonly locale?: string;
  readonly siteName?: string;
  readonly image?: SeoImage;
  readonly noIndex?: boolean;
  readonly noFollow?: boolean;
}

export interface SeoImage {
  readonly url: string;
  readonly alt: string;
  readonly width?: number;
  readonly height?: number;
  readonly type?: string;
}

export interface ArticleSeoData extends BaseSeoData {
  readonly type: "article";
  readonly publishedTime?: string;
  readonly modifiedTime?: string;
  readonly tags?: readonly string[];
  readonly section?: string;
  readonly readingTime?: string;
  readonly wordCount?: number;
}

export interface PersonSeoData extends BaseSeoData {
  readonly type: "person";
  readonly jobTitle?: string;
  readonly organization?: string;
  readonly location?: string;
  readonly sameAs?: readonly string[];
}

export interface WebsiteSeoData extends BaseSeoData {
  readonly type: "website";
  readonly url: string;
}

export interface ProjectSeoData extends BaseSeoData {
  readonly type: "project";
  readonly technologies?: readonly string[];
  readonly githubUrl?: string;
  readonly liveUrl?: string;
  readonly startDate?: string;
  readonly status?: "active" | "completed" | "archived";
}

export interface PhotoSeoData extends BaseSeoData {
  readonly type: "photo";
  readonly dateTaken?: string;
  readonly location?: string;
  readonly camera?: string;
  readonly tags?: readonly string[];
  readonly collection?: string;
}

export interface MusicSeoData extends BaseSeoData {
  readonly type: "music";
  readonly artist?: string;
  readonly album?: string;
  readonly genre?: readonly string[];
  readonly duration?: string;
  readonly releaseDate?: string;
}

export type SeoData =
  | ArticleSeoData
  | PersonSeoData
  | WebsiteSeoData
  | ProjectSeoData
  | PhotoSeoData
  | MusicSeoData;

export interface StructuredData {
  readonly "@context": string;
  readonly "@type": string;
  readonly [key: string]: unknown;
}

export interface SeoConfig {
  readonly defaultTitle: string;
  readonly titleTemplate: string;
  readonly defaultDescription: string;
  readonly defaultImage: SeoImage;
  readonly siteUrl: string;
  readonly siteName: string;
  readonly author: PersonSeoData;
  readonly twitterHandle?: string;
  readonly facebookAppId?: string;
  readonly locale: string;
  readonly alternateLocales?: readonly string[];
}

export interface OpenGraphData {
  readonly title: string;
  readonly description: string;
  readonly type:
    | "website"
    | "article"
    | "profile"
    | "music.song"
    | "video.other";
  readonly url: string;
  readonly image?: SeoImage;
  readonly siteName: string;
  readonly locale: string;
  readonly article?: {
    readonly publishedTime?: string;
    readonly modifiedTime?: string;
    readonly author?: string;
    readonly section?: string;
    readonly tags?: readonly string[];
  };
  readonly profile?: {
    readonly firstName?: string;
    readonly lastName?: string;
    readonly username?: string;
  };
}

export interface TwitterCardData {
  readonly card: "summary" | "summary_large_image" | "app" | "player";
  readonly site?: string;
  readonly creator?: string;
  readonly title: string;
  readonly description: string;
  readonly image?: SeoImage;
}

export interface SeoMetaTags {
  readonly title: string;
  readonly meta: Array<{
    readonly name?: string;
    readonly property?: string;
    readonly content: string;
    readonly hid?: string;
  }>;
  readonly link?: Array<{
    readonly rel: string;
    readonly href: string;
    readonly hid?: string;
  }>;
  readonly script?: Array<{
    readonly type: string;
    readonly innerHTML: string;
    readonly hid?: string;
  }>;
}
