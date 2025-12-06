# Docsify Interactive Checkboxes

> A lightweight plugin that transforms markdown checkboxes into interactive, persistent task lists.

## ✨ Features

- 🖱️ **Interactive Checkboxes** - Click to toggle task completion
- 💾 **Persistent State** - Saved in browser localStorage
- 📄 **Per-Page Storage** - Each page maintains its own states
- 🎨 **Visual Feedback** - Completed tasks show strikethrough styling
- ⚡ **Zero Dependencies** - Pure JavaScript
- 🚀 **Easy Integration** - Drop-in solution

## 🎯 Quick Demo

Try clicking these checkboxes - they'll save automatically!

- [ ] Click me to check
- [ ] I persist after refresh
- [ ] Try reloading the page!

## 📦 Installation

Add the plugin to your `index.html`:

```html
<script>
  window.$docsify = {
    // ... your config
    
    plugins: [
      function(hook, vm) {
        const STORAGE_PREFIX = 'docsify-checkbox-';
        
        function getStorageKey() {
          return STORAGE_PREFIX + (vm.route.path || 'index');
        }
        
        function loadCheckboxStates() {
          const stored = localStorage.getItem(getStorageKey());
          return stored ? JSON.parse(stored) : {};
        }
        
        function saveCheckboxStates(states) {
          localStorage.setItem(getStorageKey(), JSON.stringify(states));
        }
        
        hook.doneEach(function() {
          const checkboxes = document.querySelectorAll(
            '.task-list-item input[type="checkbox"]'
          );
          const states = loadCheckboxStates();
          
          checkboxes.forEach((checkbox, index) => {
            const id = 'checkbox-' + index;
            checkbox.id = id;
            checkbox.removeAttribute('disabled');
            
            if (states[id] !== undefined) {
              checkbox.checked = states[id];
              if (checkbox.checked) {
                checkbox.parentElement.classList.add('checked');
              }
            }
            
            checkbox.addEventListener('change', function(e) {
              const isChecked = e.target.checked;
              e.target.parentElement.classList.toggle('checked', isChecked);
              
              const currentStates = loadCheckboxStates();
              currentStates[id] = isChecked;
              saveCheckboxStates(currentStates);
            });
          });
        });
      }
    ]
  }
</script>
```

## 🎨 Styling

Add these styles for better visual feedback:

```css
.task-list-item {
  list-style-type: none;
  margin-left: -1.5em;
}

.task-list-item input[type="checkbox"] {
  margin-right: 0.5em;
  cursor: pointer;
}

.task-list-item.checked {
  opacity: 0.6;
  text-decoration: line-through;
}
```

## 📖 Usage

Use standard markdown checkbox syntax:

```markdown
- [ ] Unchecked task
- [x] Pre-checked task
- [ ] Another task
```

See the [Demo](demo.md) page for a full example with many checkboxes!
