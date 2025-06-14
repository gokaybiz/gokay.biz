export const useNormalizePath =
  () =>
  (path: string): string =>
    path === "/" ? "/" : path.replace(/\/+$/, "");
