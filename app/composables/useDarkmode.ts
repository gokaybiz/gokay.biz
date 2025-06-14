export enum ThemeMode {
  Dark = "dark",
  Light = "light",
}

export type ThemeType = `${ThemeMode}`;

const getCurrentMode = (): ThemeType =>
  typeof document === "undefined"
    ? ThemeMode.Light
    : document.documentElement.classList.contains(ThemeMode.Dark)
      ? ThemeMode.Dark
      : ThemeMode.Light;

const setMode = (mode: ThemeType) => {
  if (typeof document === "undefined" || typeof localStorage === "undefined")
    return;

  document.documentElement.classList.toggle(
    ThemeMode.Dark,
    mode === ThemeMode.Dark,
  );
  localStorage.setItem("themeStyle", mode);
};

const toggleMode = (mode: ThemeType): ThemeType =>
  mode === ThemeMode.Dark ? ThemeMode.Light : ThemeMode.Dark;

export const useDarkMode = () => (): void => {
  const current = getCurrentMode();
  const next = toggleMode(current);
  setMode(next);
};
