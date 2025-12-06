/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const path = require('path');

// Load plugin code
const pluginCode = fs.readFileSync(path.resolve(__dirname, '../src/plugin.js'), 'utf8');

describe('Docsify Interactive Checkboxes', () => {
    let mockHook;
    let mockVm;

    beforeEach(() => {
        // Mock DOM
        document.body.innerHTML = `
            <ul class="task-list">
                <li class="task-list-item">
                    <input type="checkbox" disabled /> Task 1
                </li>
                <li class="task-list-item">
                    <input type="checkbox" disabled /> Task 2
                </li>
            </ul>
        `;

        // Clear localStorage
        localStorage.clear();

        // Mock Docsify
        window.$docsify = {
            interactiveCheckboxes: {
                storagePrefix: 'test-',
                cleanOrphanedStates: true
            },
            plugins: []
        };

        // Mock Hook and VM
        mockHook = {
            doneEach: jest.fn(callback => callback())
        };
        mockVm = {
            route: { path: '/test-page' }
        };

        // Execute plugin code
        // We evaluate it to simulate loading the script in the browser
        eval(pluginCode);

        // The IIFE pushes the plugin function to window.$docsify.plugins
        const pluginFunction = window.$docsify.plugins[window.$docsify.plugins.length - 1];

        // Execute the plugin logic
        pluginFunction(mockHook, mockVm);
    });

    test('should activate checkboxes', () => {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            expect(cb.disabled).toBe(false);
            expect(cb.style.cursor).toBe('pointer');
            // Verify new ID format: cb-<hash>-<index>
            expect(cb.id).toMatch(/^cb-[a-z0-9]+-\d+$/);
        });
    });

    test('should save state to localStorage', () => {
        const checkbox = document.querySelector('input[type="checkbox"]');

        // Calculate expected ID (since it's generated based on content)
        const id = checkbox.id;

        // Update check state manually and trigger change event
        checkbox.checked = true;

        const event = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(event);

        const key = 'test-/test-page';
        const stored = JSON.parse(localStorage.getItem(key));

        expect(stored).toBeTruthy();
        expect(stored[id]).toBe(true);
    });

    test('should restore state from localStorage', () => {
        // 1. Get ID
        const checkbox = document.querySelector('input[type="checkbox"]');
        const id = checkbox.id;

        // 2. Set localStorage state
        const key = 'test-/test-page';
        const state = {};
        state[id] = true;
        localStorage.setItem(key, JSON.stringify(state));

        // 3. Re-run plugin initialization (simulate page reload)
        // Reset DOM state first
        checkbox.checked = false;
        checkbox.parentElement.classList.remove('checked');

        const pluginFunction = window.$docsify.plugins[window.$docsify.plugins.length - 1];
        pluginFunction(mockHook, mockVm);

        expect(checkbox.checked).toBe(true);
        expect(checkbox.parentElement.classList.contains('checked')).toBe(true);
    });

    test('should export global functions', () => {
        expect(typeof window.getDocsifyCheckboxProgress).toBe('function');
        expect(typeof window.clearAllDocsifyCheckboxes).toBe('function');
        expect(typeof window.exportDocsifyCheckboxStates).toBe('function');
        expect(typeof window.importDocsifyCheckboxStates).toBe('function');
    });

    test('should clean orphaned states', () => {
        const key = 'test-/test-page';
        // Add an orphan state (ID that doesn't exist in current DOM)
        const initialState = {
            'cb-orphan-999': true,
            [document.querySelector('input').id]: true
        };
        localStorage.setItem(key, JSON.stringify(initialState));

        // Re-run plugin to trigger cleanup
        const pluginFunction = window.$docsify.plugins[window.$docsify.plugins.length - 1];
        pluginFunction(mockHook, mockVm);

        const stored = JSON.parse(localStorage.getItem(key));
        expect(stored['cb-orphan-999']).toBeUndefined();
        expect(stored[document.querySelector('input').id]).toBe(true);
    });
});
