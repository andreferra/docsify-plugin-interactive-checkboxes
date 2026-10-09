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

    describe('storage validation', () => {
        const key = 'test-/test-page';

        beforeEach(() => {
            jest.spyOn(console, 'warn').mockImplementation(() => {});
            jest.spyOn(console, 'error').mockImplementation(() => {});
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        test.each(['null', '42', '"text"', '[true, false]', '{not json'])(
            'should not crash when stored states are %s',
            (stored) => {
                localStorage.setItem(key, stored);
                const pluginFunction = window.$docsify.plugins[window.$docsify.plugins.length - 1];

                expect(() => pluginFunction(mockHook, mockVm)).not.toThrow();
                document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    expect(cb.disabled).toBe(false);
                });
            }
        );

        test('should ignore non-boolean stored values', () => {
            const checkbox = document.querySelector('input[type="checkbox"]');
            localStorage.setItem(key, JSON.stringify({ [checkbox.id]: 'yes' }));
            checkbox.checked = false;

            const pluginFunction = window.$docsify.plugins[window.$docsify.plugins.length - 1];
            pluginFunction(mockHook, mockVm);

            expect(checkbox.checked).toBe(false);
        });

        test('import should reject non-object data', () => {
            expect(window.importDocsifyCheckboxStates(null)).toBe(false);
            expect(window.importDocsifyCheckboxStates('x')).toBe(false);
            expect(window.importDocsifyCheckboxStates([1, 2])).toBe(false);
        });

        test('import should only write keys with the configured prefix', () => {
            localStorage.setItem('auth-token', 'secret');

            const result = window.importDocsifyCheckboxStates({
                'auth-token': { hacked: true },
                'other-key': { a: true },
                'test-/page': { 'cb-1-0': true, 'cb-2-1': 'bad' }
            });

            expect(result).toBe(true);
            expect(localStorage.getItem('auth-token')).toBe('secret');
            expect(localStorage.getItem('other-key')).toBeNull();
            expect(JSON.parse(localStorage.getItem('test-/page'))).toEqual({ 'cb-1-0': true });
        });

        test('import should reject entries whose value is not an object', () => {
            const result = window.importDocsifyCheckboxStates({ 'test-/page': 'oops' });

            expect(result).toBe(false);
            expect(localStorage.getItem('test-/page')).toBeNull();
        });

        test('should fall back to the default prefix when storagePrefix is empty', () => {
            window.$docsify.interactiveCheckboxes.storagePrefix = '';
            document.body.innerHTML = '<ul><li class="task-list-item"><input type="checkbox" disabled /> Task 1</li></ul>';
            const pluginFunction = window.$docsify.plugins[window.$docsify.plugins.length - 1];
            pluginFunction(mockHook, mockVm);

            const checkbox = document.querySelector('input[type="checkbox"]');
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change'));

            expect(localStorage.getItem('/test-page')).toBeNull();
            expect(window.exportDocsifyCheckboxStates()).toEqual({
                'docsify-checkbox-/test-page': { [checkbox.id]: true }
            });
        });

        test('export should use the configured prefix', () => {
            localStorage.setItem('test-/page', JSON.stringify({ 'cb-1-0': true }));
            localStorage.setItem('docsify-checkbox-/other', JSON.stringify({ 'cb-2-0': true }));

            expect(window.exportDocsifyCheckboxStates()).toEqual({
                'test-/page': { 'cb-1-0': true }
            });
        });
    });

    describe('checkbox scope and stable IDs', () => {
        const key = 'test-/test-page';
        const runPlugin = () => {
            const pluginFunction = window.$docsify.plugins[window.$docsify.plugins.length - 1];
            pluginFunction(mockHook, mockVm);
        };
        const render = (items) => {
            document.body.innerHTML = `
                <aside class="sidebar"><ul><li><input type="checkbox" disabled /> Sidebar</li></ul></aside>
                <article class="markdown-section"><ul>${items}</ul></article>
            `;
        };
        const item = (text, nested = '') =>
            `<li class="task-list-item"><input type="checkbox" disabled /> ${text}${nested}</li>`;

        test('should ignore checkboxes outside the content area', () => {
            render(item('Task A'));
            runPlugin();

            expect(document.querySelector('.sidebar input').disabled).toBe(true);
            expect(document.querySelector('.markdown-section input').disabled).toBe(false);
            expect(window.getDocsifyCheckboxProgress().total).toBe(1);
        });

        test('should keep state when an item is inserted above', () => {
            render(item('Task A') + item('Task B'));
            runPlugin();

            const taskB = document.querySelectorAll('.markdown-section input')[1];
            taskB.checked = true;
            taskB.dispatchEvent(new Event('change'));

            render(item('New task') + item('Task A') + item('Task B'));
            runPlugin();

            const inputs = document.querySelectorAll('.markdown-section input');
            expect(inputs[0].checked).toBe(false);
            expect(inputs[1].checked).toBe(false);
            expect(inputs[2].checked).toBe(true);
        });

        test('should give distinct IDs to items with the same text', () => {
            render(item('Same') + item('Same'));
            runPlugin();

            const [first, second] = document.querySelectorAll('.markdown-section input');
            expect(first.id).not.toBe(second.id);
        });

        test('should not change parent ID when a nested item changes', () => {
            const nested = (text) => `<ul>${item(text)}</ul>`;
            render(item('Parent', nested('Child v1')));
            runPlugin();
            const parentId = document.querySelector('.markdown-section input').id;

            render(item('Parent', nested('Child v2')));
            runPlugin();

            expect(document.querySelector('.markdown-section input').id).toBe(parentId);
        });

        test('should migrate states saved with the legacy ID format', () => {
            render(item('Parent', '<ul>' + item('Child') + '</ul>') + item('Task B'));
            // Legacy IDs: hash of text including nested items + page index
            const hash = (str) => {
                let h = 0;
                for (let i = 0; i < str.length; i++) {
                    h = ((h << 5) - h) + str.charCodeAt(i);
                    h = h & h;
                }
                return Math.abs(h).toString(36);
            };
            const legacyText = (li) => {
                const clone = li.cloneNode(true);
                clone.querySelectorAll('input').forEach(el => el.remove());
                return clone.textContent.trim().slice(0, 50);
            };
            const lis = document.querySelectorAll('.markdown-section li');
            localStorage.setItem(key, JSON.stringify({
                [`cb-${hash(legacyText(lis[0]))}-0`]: true,
                [`cb-${hash(legacyText(lis[2]))}-2`]: true
            }));

            runPlugin();

            const inputs = document.querySelectorAll('.markdown-section input');
            expect(inputs[0].checked).toBe(true);
            expect(inputs[1].checked).toBe(false);
            expect(inputs[2].checked).toBe(true);

            const stored = JSON.parse(localStorage.getItem(key));
            expect(Object.keys(stored).sort()).toEqual([inputs[0].id, inputs[2].id].sort());
        });
    });
});
