import * as fs from "node:fs";
import * as path from "node:path";
import matter from "gray-matter";
import { defaultValues } from "../content.config";
import type { PostSchema } from "../content.config";
import type { z } from "zod";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

type SchemaShape = z.infer<typeof PostSchema>;

if (!fs.existsSync(BLOG_DIR)) {
  console.log(`❌ Directory ${BLOG_DIR} doesn't exist!`);
  process.exit(1);
}

// Read all markdown files
const files = fs.readdirSync(BLOG_DIR).filter((file) => file.endsWith(".md"));

console.log(`Found ${files.length} markdown files to process.`);

for (const file of files) {
  const filePath = path.join(BLOG_DIR, file);
  const content = fs.readFileSync(filePath, "utf8");
  const { data, content: markdown } = matter(content); //gray-matter to parse metadata

  const frontmatter: Partial<SchemaShape> = data || {};

  const fileName = path.basename(file, ".md");
  let modified = false;

  // Check for missing fields and add defaults based on schema
  if (!frontmatter.title) {
    frontmatter.title = fileName
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    modified = true;
  }

  if (!frontmatter.description) {
    // Try to extract first paragraph of content, or use a default
    let firstParagraph = markdown
      ?.trim()
      ?.split("\n\n")[0]
      ?.replace(/^#+ /, "") // Remove markdown heading markers
      ?.trim();

    if (firstParagraph !== undefined && firstParagraph.length >= 300) {
      firstParagraph = `${firstParagraph.substring(0, 300)}...`;
    }
    frontmatter.description =
      firstParagraph || `Please write a description for ${frontmatter.title}`;
    modified = true;
  }

  if (!frontmatter.createdAt) {
    // Use the same default logic from your schema
    frontmatter.createdAt = defaultValues.createdAt();
    modified = true;
  }

  if (!frontmatter.tags) {
    frontmatter.tags = defaultValues.tags();
    modified = true;
  }

  if (!frontmatter.related) {
    frontmatter.related = defaultValues.related();
    modified = true;
  }

  if (frontmatter.featured === undefined) {
    frontmatter.featured = defaultValues.featured;
    modified = true;
  }

  // Only rewrite the file if changes were made
  if (!modified) {
    console.log(`ℹ️ No changes needed for ${file}`);
    continue;
  }

  const newContent = matter.stringify(markdown, frontmatter);
  fs.writeFileSync(filePath, newContent);
  console.log(`✅ Updated frontmatter for ${file}`);
}

console.log("🎉 All markdown files have been processed.");
