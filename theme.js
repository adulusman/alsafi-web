'use strict';

const STORAGE_KEY = 'alsafi-theme';

function getStoredTheme() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'dark' || stored === 'light') return stored;
    } catch (_) {}
    return 'light';
}

function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDark ? '#0F1117' : '#FAFAF9');

    try {
        localStorage.setItem(STORAGE_KEY, theme);
    } catch (_) {}

    updateToggleUI(theme);
}

function updateToggleUI(theme) {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    toggle.querySelectorAll('[data-theme-value]').forEach((btn) => {
        const active = btn.getAttribute('data-theme-value') === theme;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', String(active));
    });
}

function createToggle() {
    const group = document.createElement('div');
    group.className = 'theme-toggle';
    group.id = 'themeToggle';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Color theme');

    ['light', 'dark'].forEach((value) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'theme-toggle__option';
        btn.setAttribute('data-theme-value', value);
        btn.textContent = value.charAt(0).toUpperCase() + value.slice(1);
        btn.setAttribute('aria-pressed', 'false');
        btn.addEventListener('click', () => applyTheme(value));
        group.appendChild(btn);
    });

    return group;
}

function injectToggle() {
    if (document.getElementById('themeToggle')) return;

    const wrapper = document.querySelector('.nav-wrapper');
    if (!wrapper) return;

    const toggle = createToggle();
    const menuToggle = wrapper.querySelector('.mobile-menu-toggle');
    if (menuToggle) {
        wrapper.insertBefore(toggle, menuToggle);
    } else {
        wrapper.appendChild(toggle);
    }
}

function initEarly() {
    applyTheme(getStoredTheme());
}

function init() {
    injectToggle();
    updateToggleUI(getStoredTheme());
}

initEarly();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
