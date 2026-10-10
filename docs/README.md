# Docsify Interactive Checkboxes

> A lightweight plugin that transforms markdown checkboxes into interactive, persistent task lists.

## ✨ Features

- 🖱️ **Interactive Checkboxes** - Click to toggle task completion
- 💾 **Persistent State** - Saved in browser localStorage
- 🛡️ **Stable IDs (v2)** - States persist correctly even when reordering items
- 📄 **Per-Page Storage** - Each page maintains its own states
- 🎨 **Visual Feedback** - Completed tasks show strikethrough + fade
- ⚡ **Zero Dependencies** - Pure JavaScript
- 🚀 **Easy Integration** - Drop-in solution

## 🎯 Quick Demo

Try clicking these checkboxes - they'll save automatically!

- [ ] Click me to check
- [ ] I persist after refresh
- [ ] Try reloading the page!

## 📦 Installation

Please refer to the [Installation Guide](installation.md) for detailed instructions on using NPM or CDN.

```html
<!-- Quick CDN link -->
<script src="https://cdn.jsdelivr.net/npm/docsify-interactive-checkboxes@2/dist/plugin.min.js"></script>
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
