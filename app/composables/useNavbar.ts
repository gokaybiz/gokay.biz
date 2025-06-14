// ------------------------------
// --- Types ---
// ------------------------------

type NavbarState = {
  readonly isHidden: boolean;
};

// ------------------------------
// --- State Transitions---
// ------------------------------

const createInitialState = (): NavbarState => ({ isHidden: true });

const setNavbarVisibility =
  (isHidden: boolean) =>
  (state: NavbarState): NavbarState => ({
    ...state,
    isHidden,
  });

const getNavbarVisibility = (state: NavbarState): boolean => !state.isHidden;

export const useNavbar = () => {
  const navbarState = useState<NavbarState>("navbarState", createInitialState);

  const updateState = (stateFn: (s: NavbarState) => NavbarState): void => {
    navbarState.value = stateFn(navbarState.value);
  };

  const setHideNavbar = (status: boolean): void => {
    updateState(setNavbarVisibility(status));
  };

  const isNavbarVisible = computed<boolean>(() =>
    getNavbarVisibility(navbarState.value),
  );

  return {
    setHideNavbar,
    isNavbarVisible,
  };
};
