import { defineContentConfig, defineCollection } from "@nuxt/content";
import { z } from "zod";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Configure dayjs with required plugins
const configureDayjs = (): typeof dayjs => {
  dayjs.extend(utc);
  dayjs.extend(timezone);
  return dayjs;
};

// Initialize configured dayjs
const configuredDayjs = configureDayjs();

// Generate ISO string with timezone
const createTimestamp = (tz?: string): string =>
  configuredDayjs()
    .tz(tz ?? process.env.NUXT_PUBLIC_TIMEZONE)
    .toISOString();

// Curried function for timestamp creation
const nowISOString = (): string => createTimestamp();

// Immutable default values
export const defaultValues = {
  createdAt: nowISOString,
  tags: () => [],
  related: () => [],
  featured: false,
} as const;

export const PostSchema = z.object({
  title: z.string().min(1, "Title must not be empty"),
  description: z.string().min(1, "Description must not be empty"),
  rawbody: z.string(),
  createdAt: z.string().datetime().default(defaultValues.createdAt),
  updatedAt: z.string().datetime().optional(),
  tags: z.array(z.string()).default(defaultValues.tags()),
  related: z.array(z.string()).default(defaultValues.related()),
  thumbnail: z.string().optional(),
  featured: z.boolean().default(defaultValues.featured),
});

export const PageSchema = z.object({
  title: z.string().min(1, "Title must not be empty"),
  description: z.string().min(1, "Description must not be empty"),
  createdAt: z.string().datetime().default(defaultValues.createdAt),
  updatedAt: z.string().datetime().optional(),
});

// Schema definitions with enums
const ProjectStatusEnum = z.enum(["active", "completed", "maintained"]);
const ProjectLinkTypeEnum = z.enum([
  "github",
  "live",
  "demo",
  "case-study",
  "docs",
]);

// Composed project schema
export const ProjectSchema = z.object({
  title: z.string().min(1, "Title is missing"),
  description: z.string().min(1, "Project needs a description"),
  techs: z.array(z.string()).min(1, "Please provide at least one tech"),
  status: ProjectStatusEnum.default("active"),
  links: z
    .array(
      z.object({
        type: ProjectLinkTypeEnum,
        url: z.string(),
      }),
    )
    .nullable(),
});

// Type exports derived from schemas (single source of truth)
export type ProjectStatus = z.infer<typeof ProjectStatusEnum>;
export type ProjectLinkType = z.infer<typeof ProjectLinkTypeEnum>;
export type ProjectLink = {
  type: ProjectLinkType;
  url: string;
};

// Content configuration
const contentConfig = {
  collections: {
    pages: defineCollection({
      type: "page",
      source: "pages/*.md",
      schema: PageSchema,
    }),
    posts: defineCollection({
      type: "page",
      source: "blog/*.md",
      schema: PostSchema,
    }),
    projects: defineCollection({
      type: "data",
      source: "projects/*.yml",
      schema: ProjectSchema,
    }),
  },
};

export default defineContentConfig(contentConfig);
