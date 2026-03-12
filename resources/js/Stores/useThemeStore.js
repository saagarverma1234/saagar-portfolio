import { defineStore } from 'pinia';

// Safe browser-only check (localStorage/document don't exist in Node.js SSR)
const isBrowser = typeof window !== 'undefined';

export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: isBrowser ? (localStorage.getItem('theme') || 'dark') : 'dark',
  }),
  actions: {
    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
      if (isBrowser) {
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
      }
    },
    applyTheme() {
      if (isBrowser) {
        document.documentElement.setAttribute('data-theme', this.theme);
      }
    },
    init() {
      this.applyTheme();
    }
  }
});
