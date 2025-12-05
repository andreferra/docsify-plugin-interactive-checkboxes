/**
 * Docsify Interactive Checkboxes Plugin
 * 
 * Transforms standard markdown checkboxes into interactive, persistent task lists.
 * 
 * @author Andrea Ferrario
 * @license MIT
 * @version 1.0.0
 */

(function () {
    'use strict';

    // Plugin configuration
    const DEFAULT_CONFIG = {
        storagePrefix: 'docsify-checkbox-',
        strikethroughCompleted: true,
        fadeCompleted: true,
        fadeOpacity: 0.6
    };

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
         * Apply visual styles to a checkbox item
         * @param {HTMLElement} listItem - The list item element
         * @param {boolean} isChecked - Whether the checkbox is checked
         */
        function applyStyles(listItem, isChecked) {
            if (isChecked) {
                listItem.classList.add('checked');
                if (config.fadeCompleted) {
                    listItem.style.opacity = config.fadeOpacity;
                }
            } else {
                listItem.classList.remove('checked');
                if (config.fadeCompleted) {
                    listItem.style.opacity = '';
                }
            }
        }

        /**
         * Initialize checkboxes after each page render
         */
        hook.doneEach(function () {
            // Find all task list checkboxes
            const checkboxes = document.querySelectorAll(
                '.task-list-item input[type="checkbox"], ' +
                'li input[type="checkbox"]'
            );

            if (checkboxes.length === 0) return;

            const states = loadCheckboxStates();

            checkboxes.forEach((checkbox, index) => {
                const checkboxId = 'checkbox-' + index;
                checkbox.id = checkboxId;
                checkbox.setAttribute('data-checkbox-id', checkboxId);

                // Remove disabled attribute (Docsify adds this by default)
                checkbox.removeAttribute('disabled');

                // Add cursor pointer for better UX
                checkbox.style.cursor = 'pointer';

                // Restore saved state
                if (states[checkboxId] !== undefined) {
                    checkbox.checked = states[checkboxId];
                    const listItem = checkbox.closest('li') || checkbox.parentElement;
                    applyStyles(listItem, checkbox.checked);
                } else if (checkbox.checked) {
                    // Handle pre-checked boxes from markdown ([x])
                    const listItem = checkbox.closest('li') || checkbox.parentElement;
                    applyStyles(listItem, true);
                }

                // Remove existing listeners to prevent duplicates
                const newCheckbox = checkbox.cloneNode(true);
                checkbox.parentNode.replaceChild(newCheckbox, checkbox);

                // Add change event listener
                newCheckbox.addEventListener('change', function (e) {
                    const isChecked = e.target.checked;
                    const listItem = e.target.closest('li') || e.target.parentElement;

                    // Apply visual feedback
                    applyStyles(listItem, isChecked);

                    // Save state
                    const currentStates = loadCheckboxStates();
                    currentStates[checkboxId] = isChecked;
                    saveCheckboxStates(currentStates);

                    // Dispatch custom event for external integrations
                    document.dispatchEvent(new CustomEvent('docsify-checkbox-change', {
                        detail: {
                            checkboxId,
                            checked: isChecked,
                            page: vm.route.path
                        }
                    }));
                });
            });
        });
    }

    // Utility function to clear all checkbox states
    window.clearAllDocsifyCheckboxes = function (prefix) {
        const storagePrefix = prefix || DEFAULT_CONFIG.storagePrefix;
        Object.keys(localStorage)
            .filter(key => key.startsWith(storagePrefix))
            .forEach(key => localStorage.removeItem(key));
        location.reload();
    };

    // Utility function to get progress for current page
    window.getDocsifyCheckboxProgress = function () {
        const checkboxes = document.querySelectorAll(
            '.task-list-item input[type="checkbox"], ' +
            'li input[type="checkbox"]'
        );
        const total = checkboxes.length;
        const checked = Array.from(checkboxes).filter(cb => cb.checked).length;
        return {
            total,
            checked,
            percentage: total > 0 ? Math.round((checked / total) * 100) : 0
        };
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
