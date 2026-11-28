/**
 * Taller Bio Labs (키즈핏 바이오 랩)
 * Theme Switcher Module (src/js/theme-switcher.js)
 * 
 * Themes:
 * - 'dark' (Default): Obsidian Glassmorphism (#060911, backdrop-filter: blur(20px), Cyan/Emerald/Amber)
 * - 'light': Clean Clinic White (#FAF8F5 / #FFFFFF, Royal Indigo, Emerald Mint)
 * 
 * Features:
 * - Instant DOM reactive toggle (data-theme attribute on <html> and <body>)
 * - localStorage persistence ('taller_theme')
 * - Header button UI synchronization
 */

(function (global) {
  'use strict';

  let currentTheme = 'dark'; // Default theme is Dark Obsidian Bio

  function initTheme() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = localStorage.getItem('taller_theme');
        if (saved === 'dark' || saved === 'light') {
          currentTheme = saved;
        } else {
          currentTheme = 'dark'; // Default Obsidian Bio
        }
      } catch (e) {
        currentTheme = 'dark';
      }
    }
    applyThemeToDOM(currentTheme);
  }

  function getTheme() {
    return currentTheme;
  }

  function setTheme(theme) {
    if (theme !== 'dark' && theme !== 'light') return;
    currentTheme = theme;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('taller_theme', currentTheme);
      } catch (e) {}
    }
    applyThemeToDOM(currentTheme);
  }

  function toggleTheme() {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }

  function applyThemeToDOM(theme) {
    if (typeof document === 'undefined') return;

    document.documentElement.setAttribute('data-theme', theme);
    if (document.body) {
      document.body.setAttribute('data-theme', theme);
    }

    const btn = document.getElementById('btn-theme-toggle');
    if (btn) {
      if (theme === 'dark') {
        btn.innerHTML = '<span class="theme-icon">🌙</span> <span class="theme-text">Dark Bio</span>';
        btn.setAttribute('aria-label', 'Switch to Light Clinic Theme');
      } else {
        btn.innerHTML = '<span class="theme-icon">☀️</span> <span class="theme-text">Light Clinic</span>';
        btn.setAttribute('aria-label', 'Switch to Dark Bio Theme');
      }
    }

    // Dispatch custom event for charts or components that adjust colors
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('taller-theme-change', {
        detail: { theme: theme }
      }));
    }
  }

  const ThemeSwitcher = {
    initTheme,
    getTheme,
    setTheme,
    toggleTheme,
    applyThemeToDOM
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeSwitcher;
  } else {
    global.TallerThemeSwitcher = ThemeSwitcher;
    if (typeof window !== 'undefined') {
      // Execute immediately to prevent flash of wrong theme
      initTheme();
      window.addEventListener('DOMContentLoaded', () => {
        initTheme();
        const btn = document.getElementById('btn-theme-toggle');
        if (btn) {
          btn.addEventListener('click', () => {
            toggleTheme();
          });
        }
      });
    }
  }

})(typeof window !== 'undefined' ? window : global);
