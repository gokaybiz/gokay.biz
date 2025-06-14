import { Effect, pipe, Option } from "effect";

type MarkdownString = string;
type WordCount = number;
type ImageCount = number;

class MarkdownError extends Error {
  readonly _tag = "MarkdownError";
  constructor(message: string) {
    super(message);
    this.name = "MarkdownError";
  }
}

// Validate input with refined error
const validateInput = (markdown: unknown) =>
  pipe(
    Effect.succeed(markdown),
    Effect.filterOrFail(
      (value): value is string => typeof value === "string",
      () => new MarkdownError("Expected string input"),
    ),
  );

// Clean markdown text
const cleanMarkdown = (markdown: MarkdownString) =>
  Effect.succeed(
    markdown
      .normalize("NFKC")
      .replace(/`{1,3}[\s\S]*?`{1,3}/g, "")
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/[#>*_~[\]]/g, ""),
  );

// Count words
const countWords = (text: MarkdownString) =>
  Effect.succeed(text.trim().split(/\s+/).filter(Boolean).length);

// Count images
const countImages = (markdown: MarkdownString) =>
  Effect.succeed(
    pipe(
      Option.fromNullable(markdown.match(/!\[.*?\]\(.*?\)/g)),
      Option.map((matches) => matches.length),
      Option.getOrElse(() => 0),
    ),
  );

// Format reading time
const formatReadingTime = (minutes: number, seconds: number) =>
  Effect.succeed(
    minutes === 0 && seconds === 0
      ? "<1 min"
      : minutes === 0
        ? `${seconds} sec`
        : seconds === 0
          ? `${minutes} min`
          : `${minutes} min ${seconds} sec`,
  );

// Calculate reading time
const calculateReadingTime = (
  wordCount: WordCount,
  imageCount: ImageCount,
  wpm: number,
) =>
  pipe(
    Effect.succeed({
      imageSeconds: imageCount * 13,
      baseSeconds: (wordCount / wpm) * 60,
    }),
    Effect.map(({ imageSeconds, baseSeconds }) => {
      const totalSeconds = Math.ceil(baseSeconds + imageSeconds);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return { minutes, seconds };
    }),
    Effect.flatMap(({ minutes, seconds }) =>
      formatReadingTime(minutes, seconds),
    ),
  );

export const useReadingTime =
  () =>
  (markdown: unknown, wpm = 200) =>
    pipe(
      validateInput(markdown),
      Effect.flatMap((markdown) =>
        pipe(
          Effect.all([
            pipe(markdown, cleanMarkdown, Effect.flatMap(countWords)),
            countImages(markdown),
          ]),
          Effect.flatMap(([wordCount, imageCount]) =>
            calculateReadingTime(wordCount, imageCount, wpm),
          ),
        ),
      ),
    );
