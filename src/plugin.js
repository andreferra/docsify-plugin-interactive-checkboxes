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

    /**
     * Interactive Checkboxes Plugin
     * @param {Object} hook - Docsify hook system
     * @param {Object} vm - Docsify virtual machine instance
     */
    function interactiveCheckboxesPlugin(hook, vm) {
        // Merge user config with defaults
        const config = Object.assign({}, DEFAULT_CONFIG, window.$docsify?.interactiveCheckboxes || {});

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
                return stored ? JSON.parse(stored) : {};
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
            try {
                localStorage.setItem(key, JSON.stringify(states));
            } catch (e) {
                console.warn('Docsify Interactive Checkboxes: Error saving states', e);
            }
        }

        /**
         * Generate a stable ID for a checkbox based on its content and position
         * @param {HTMLElement} checkbox - The checkbox element
         * @param {number} index - The checkbox index
         * @returns {string} Stable checkbox ID
         */
        function generateCheckboxId(checkbox, index) {
            const listItem = checkbox.closest('li');
            if (!listItem) return 'checkbox-' + index;

            // Get text content without the checkbox itself
            const clone = listItem.cloneNode(true);
            const cloneCheckbox = clone.querySelector('input[type="checkbox"]');
            if (cloneCheckbox) cloneCheckbox.remove();

            const text = clone.textContent.trim().slice(0, 50);
            const hash = simpleHash(text);

            return `cb-${hash}-${index}`;
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
                if (validIdSet.has(id)) {
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
            // Find all task list checkboxes (more specific selector)
            const checkboxes = document.querySelectorAll(
                '.task-list-item input[type="checkbox"], li input[type="checkbox"]'
            );

            if (checkboxes.length === 0) return;

            // Load states once
            const states = loadCheckboxStates();
            const validIds = [];

            checkboxes.forEach((checkbox, index) => {
                const checkboxId = generateCheckboxId(checkbox, index);
                validIds.push(checkboxId);

                checkbox.id = checkboxId;
                checkbox.setAttribute('data-checkbox-id', checkboxId);

                // Remove disabled attribute (Docsify adds this by default)
                checkbox.removeAttribute('disabled');

                // Add cursor pointer for better UX
                checkbox.style.cursor = 'pointer';

                const listItem = checkbox.closest('li');
                if (!listItem) return;

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
                            progress: getProgress()
                        }
                    }));
                });
            });

            // Clean orphaned states
            cleanOrphanedStates(validIds);
        });

        /**
         * Get progress for current page
         * @returns {Object} Progress statistics
         */
        function getProgress() {
            const checkboxes = document.querySelectorAll(
                '.task-list-item input[type="checkbox"], li input[type="checkbox"]'
            );
            const total = checkboxes.length;
            const checked = Array.from(checkboxes).filter(cb => cb.checked).length;
            return {
                total,
                checked,
                percentage: total > 0 ? Math.round((checked / total) * 100) : 0
            };
        }
    }

    // Utility function to clear all checkbox states
    window.clearAllDocsifyCheckboxes = function (prefix) {
        const storagePrefix = prefix || DEFAULT_CONFIG.storagePrefix;
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
    window.getDocsifyCheckboxProgress = function () {
        const checkboxes = document.querySelectorAll(
            '.task-list-item input[type="checkbox"], li input[type="checkbox"]'
        );
        const total = checkboxes.length;
        const checked = Array.from(checkboxes).filter(cb => cb.checked).length;
        return {
            total,
            checked,
            percentage: total > 0 ? Math.round((checked / total) * 100) : 0
        };
    };

    // Utility function to export checkbox states
    window.exportDocsifyCheckboxStates = function () {
        const storagePrefix = DEFAULT_CONFIG.storagePrefix;
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
    window.importDocsifyCheckboxStates = function (data) {
        try {
            Object.keys(data).forEach(key => {
                localStorage.setItem(key, JSON.stringify(data[key]));
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