/**
 * Docsify Interactive Checkboxes Plugin
 * 
 * Transforms standard markdown checkboxes into interactive, persistent task lists.
 * 
 * @author Andrea Ferrario
 * @license MIT
 * @version 2.0.1
 */

(function () {
    'use strict';

    // Plugin configuration
    const DEFAULT_CONFIG = {
        storagePrefix: 'docsify-checkbox-',
        strikethroughCompleted: true,
        fadeCompleted: true,
        fadeOpacity: 0.6,
        cleanOrphanedStates: true
    };

    /**
     * Generate a stable hash from a string
     * @param {string} str - Input string
     * @returns {string} Hash string
     */
    function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }

    const CHECKBOX_SELECTOR = 'li input[type="checkbox"]';

    // Marks page states saved with the current ID format; states without it
    // use the legacy IDs (up to v2.0.1) and are migrated as a whole on first render.
    const ID_FORMAT_KEY = '__idFormatV2';

    /**
     * Find task list checkboxes inside the rendered page content.
     * Scoped to Docsify's content area so sidebar, navbar or other plugin
     * checkboxes are left untouched.
     * @returns {Array<HTMLInputElement>} Checkboxes in document order
     */
    function getCheckboxes() {
        const container = document.querySelector('.markdown-section') || document;
        return Array.from(container.querySelectorAll(CHECKBOX_SELECTOR));
    }

    /**
     * Compute completion progress for the current page
     * @returns {Object} Progress statistics
     */
    function computeProgress() {
        const checkboxes = getCheckboxes();
        const total = checkboxes.length;
        const checked = checkboxes.filter(cb => cb.checked).length;
        return {
            total,
            checked,
            percentage: total > 0 ? Math.round((checked / total) * 100) : 0
        };
    }

    /**
     * Get the text of a list item, excluding its checkbox
     * @param {HTMLElement} listItem - The list item element
     * @param {boolean} includeNested - Whether to include nested sub-list text
     * @returns {string} Text used to identify the item
     */
    function getItemText(listItem, includeNested) {
        const clone = listItem.cloneNode(true);
        const selector = includeNested ? 'input[type="checkbox"]' : 'input[type="checkbox"], ul, ol';
        clone.querySelectorAll(selector).forEach(el => el.remove());
        return clone.textContent.trim().slice(0, 50);
    }

    /**
     * Check whether a value is a plain (non-null, non-array) object
     * @param {*} value - Value to check
     * @returns {boolean} True if value is a plain object
     */
    function isPlainObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    /**
     * Keep only boolean entries from a checkbox states object
     * @param {*} states - Untrusted states value
     * @returns {Object|null} Sanitized states, or null if input is not an object
     */
    function sanitizeStates(states) {
        if (!isPlainObject(states)) return null;

        const sanitized = {};
        Object.keys(states).forEach(id => {
            if (id !== '__proto__' && typeof states[id] === 'boolean') {
                sanitized[id] = states[id];
            }
        });
        return sanitized;
    }

    /**
     * Get the storage prefix configured by the user, falling back to the default
     * @returns {string} Storage prefix
     */
    function getConfiguredPrefix() {
        const userConfig = window.$docsify && window.$docsify.interactiveCheckboxes;
        return (userConfig && userConfig.storagePrefix) || DEFAULT_CONFIG.storagePrefix;
    }

    /**
     * Interactive Checkboxes Plugin
     * @param {Object} hook - Docsify hook system
     * @param {Object} vm - Docsify virtual machine instance
     */
    function interactiveCheckboxesPlugin(hook, vm) {
        // Merge user config with defaults
        const config = Object.assign({}, DEFAULT_CONFIG, window.$docsify?.interactiveCheckboxes || {});
        // An empty prefix would make import/export/clear match every localStorage key
        config.storagePrefix = getConfiguredPrefix();

        /**
         * Generate storage key for current page
         * @returns {string} Storage key
         */
        function getStorageKey() {
            return config.storagePrefix + (vm.route.path || 'index');
        }

        /**
         * Load checkbox states from localStorage
         * @returns {Object} Stored checkbox states
         */
        function loadCheckboxStates() {
            const key = getStorageKey();
            try {
                const stored = localStorage.getItem(key);
                if (!stored) return {};

                const states = sanitizeStates(JSON.parse(stored));
                if (!states) {
                    console.warn('Docsify Interactive Checkboxes: Ignoring invalid stored states for', key);
                    return {};
                }
                return states;
            } catch (e) {
                console.warn('Docsify Interactive Checkboxes: Error loading states', e);
                return {};
            }
        }

        /**
         * Save checkbox states to localStorage
         * @param {Object} states - Checkbox states to save
         */
        function saveCheckboxStates(states) {
            const key = getStorageKey();
            states[ID_FORMAT_KEY] = true;
            try {
                localStorage.setItem(key, JSON.stringify(states));
            } catch (e) {
                console.warn('Docsify Interactive Checkboxes: Error saving states', e);
            }
        }

        /**
         * Generate a stable ID for a checkbox based on its own text.
         * Duplicate texts are disambiguated by their occurrence count, so adding
         * or removing other items does not change the ID.
         * @param {HTMLElement} listItem - The list item containing the checkbox
         * @param {Object} occurrences - Map of hash -> times seen so far on this page
         * @returns {string} Stable checkbox ID
         */
        function generateCheckboxId(listItem, occurrences) {
            const hash = simpleHash(getItemText(listItem, false));
            const occurrence = occurrences[hash] || 0;
            occurrences[hash] = occurrence + 1;

            return `cb-${hash}-${occurrence}`;
        }

        /**
         * ID format used up to v2.0.1 (text including nested items + page index),
         * kept to migrate previously saved states.
         * @param {HTMLElement} listItem - The list item containing the checkbox
         * @param {number} index - The checkbox index on the page
         * @returns {string} Legacy checkbox ID
         */
        function generateLegacyCheckboxId(listItem, index) {
            return `cb-${simpleHash(getItemText(listItem, true))}-${index}`;
        }

        /**
         * Apply visual styles to a checkbox item
         * @param {HTMLElement} listItem - The list item element
         * @param {boolean} isChecked - Whether the checkbox is checked
         */
        function applyStyles(listItem, isChecked) {
            if (isChecked) {
                listItem.classList.add('checked');

                if (config.strikethroughCompleted) {
                    listItem.style.textDecoration = 'line-through';
                }

                if (config.fadeCompleted) {
                    listItem.style.opacity = config.fadeOpacity;
                }
            } else {
                listItem.classList.remove('checked');
                listItem.style.textDecoration = '';

                if (config.fadeCompleted) {
                    listItem.style.opacity = '';
                }
            }
        }

        /**
         * Clean orphaned states from localStorage
         * @param {Array<string>} validIds - Array of current valid checkbox IDs
         */
        function cleanOrphanedStates(validIds) {
            if (!config.cleanOrphanedStates) return;

            const states = loadCheckboxStates();
            const validIdSet = new Set(validIds);
            const cleaned = {};
            let hasChanges = false;

            Object.keys(states).forEach(id => {
                if (validIdSet.has(id) || id === ID_FORMAT_KEY) {
                    cleaned[id] = states[id];
                } else {
                    hasChanges = true;
                }
            });

            if (hasChanges) {
                saveCheckboxStates(cleaned);
            }
        }

        /**
         * Initialize checkboxes after each page render
         */
        hook.doneEach(function () {
            const checkboxes = getCheckboxes();

            if (checkboxes.length === 0) return;

            // Load states once. Legacy-format states are read only through
            // legacy IDs, so old and new IDs can never be confused.
            const storedStates = loadCheckboxStates();
            const isLegacy = Object.keys(storedStates).length > 0 && storedStates[ID_FORMAT_KEY] !== true;
            const states = isLegacy ? {} : storedStates;
            const validIds = [];
            const occurrences = {};

            checkboxes.forEach((checkbox, index) => {
                const listItem = checkbox.closest('li');
                const checkboxId = generateCheckboxId(listItem, occurrences);
                validIds.push(checkboxId);

                // Migrate state saved with the legacy ID format
                if (isLegacy) {
                    const legacyState = storedStates[generateLegacyCheckboxId(listItem, index)];
                    if (legacyState !== undefined) {
                        states[checkboxId] = legacyState;
                    }
                }

                checkbox.id = checkboxId;
                checkbox.setAttribute('data-checkbox-id', checkboxId);

                // Remove disabled attribute (Docsify adds this by default)
                checkbox.removeAttribute('disabled');

                // Add cursor pointer for better UX
                checkbox.style.cursor = 'pointer';

                // Restore saved state or use markdown state
                const savedState = states[checkboxId];
                if (savedState !== undefined) {
                    checkbox.checked = savedState;
                }

                // Apply styles based on current state
                applyStyles(listItem, checkbox.checked);

                // Check if listener already exists
                if (checkbox.hasAttribute('data-listener-attached')) return;
                checkbox.setAttribute('data-listener-attached', 'true');

                // Add change event listener
                checkbox.addEventListener('change', function (e) {
                    const isChecked = e.target.checked;
                    const targetListItem = e.target.closest('li');

                    if (targetListItem) {
                        // Apply visual feedback
                        applyStyles(targetListItem, isChecked);
                    }

                    // Save state
                    const currentStates = loadCheckboxStates();
                    currentStates[checkboxId] = isChecked;
                    saveCheckboxStates(currentStates);

                    // Dispatch custom event for external integrations
                    document.dispatchEvent(new CustomEvent('docsify-checkbox-change', {
                        detail: {
                            checkboxId,
                            checked: isChecked,
                            page: vm.route.path,
                            progress: computeProgress()
                        }
                    }));
                });
            });

            if (isLegacy) {
                saveCheckboxStates(states);
            }

            // Clean orphaned states
            cleanOrphanedStates(validIds);
        });
    }

    // Utility function to clear all checkbox states
    window.clearAllDocsifyCheckboxes = function (prefix) {
        const storagePrefix = prefix || getConfiguredPrefix();
        const keysToRemove = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(storagePrefix)) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
        location.reload();
    };

    // Utility function to get progress for current page
    window.getDocsifyCheckboxProgress = computeProgress;

    // Utility function to export checkbox states
    window.exportDocsifyCheckboxStates = function () {
        const storagePrefix = getConfiguredPrefix();
        const exports = {};

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(storagePrefix)) {
                try {
                    exports[key] = JSON.parse(localStorage.getItem(key));
                } catch (e) {
                    console.warn('Error exporting key:', key, e);
                }
            }
        }

        return exports;
    };

    // Utility function to import checkbox states
    // Only keys using the plugin storage prefix and objects of boolean values are accepted,
    // so imported data cannot overwrite unrelated localStorage entries on the same origin.
    window.importDocsifyCheckboxStates = function (data) {
        if (!isPlainObject(data)) {
            console.error('Error importing states: expected an object');
            return false;
        }

        const storagePrefix = getConfiguredPrefix();
        const validEntries = [];

        Object.keys(data).forEach(key => {
            const states = sanitizeStates(data[key]);
            if (key.startsWith(storagePrefix) && states) {
                validEntries.push([key, states]);
            } else {
                console.warn('Skipping invalid import key:', key);
            }
        });

        if (validEntries.length === 0) {
            console.error('Error importing states: no valid entries found');
            return false;
        }

        try {
            validEntries.forEach(([key, states]) => {
                localStorage.setItem(key, JSON.stringify(states));
            });
            location.reload();
            return true;
        } catch (e) {
            console.error('Error importing states:', e);
            return false;
        }
    };

    // Register plugin with Docsify
    if (window.$docsify) {
        window.$docsify.plugins = window.$docsify.plugins || [];
        window.$docsify.plugins.push(interactiveCheckboxesPlugin);
    } else {
        // Export for manual use
        window.DocsifyInteractiveCheckboxes = interactiveCheckboxesPlugin;
    }

})();