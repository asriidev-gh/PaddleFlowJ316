export const THEME_STORAGE_KEY = "ccf-theme";
export const DEFAULT_THEME = "smarthome";
export const QUICK_GAME_DEFAULT_THEME = "material";

export const APP_THEME_VALUES = [
  "makati",
  "session",
  "neon",
  "cosmos",
  "emerald",
  "sunset",
  "fintech",
  "material",
  "cupertino",
  "smarthome",
  "travel",
] as const;

/** Inline script for root layout — runs before hydration to avoid theme flash. */
export const THEME_INIT_SCRIPT = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var v=${JSON.stringify(APP_THEME_VALUES)};var s=localStorage.getItem(k);if(s&&v.indexOf(s)>=0){document.documentElement.setAttribute("data-theme",s);return;}var p=location.pathname;var q=p==="/quick-game"||p==="/play"||p.indexOf("/play/")===0;document.documentElement.setAttribute("data-theme",q?${JSON.stringify(QUICK_GAME_DEFAULT_THEME)}:${JSON.stringify(DEFAULT_THEME)});}catch(e){}})();`;
