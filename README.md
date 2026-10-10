# Docsify Interactive Checkboxes Plugin

[![GitHub Pages](https://github.com/andreferra/docsify-plugin-interactive-checkboxes/actions/workflows/deploy.yml/badge.svg)](https://github.com/andreferra/docsify-plugin-interactive-checkboxes/actions/workflows/deploy.yml)
[![npm version](https://badge.fury.io/js/docsify-interactive-checkboxes.svg)](https://badge.fury.io/js/docsify-interactive-checkboxes)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight Docsify plugin that transforms standard markdown checkboxes into interactive, persistent task lists.

## ✨ Features

- 🖱️ **Interactive Checkboxes** - Click to toggle completion
- 💾 **Persistent State** - Saved in localStorage with **stable IDs** (v2)
- 📄 **Per-Page Storage** - Each page has its own states
- 🎨 **Visual Feedback** - Strikethrough + fade effect
- 📤 **Import/Export** - Backup your progress easily
- ⚡ **Zero Dependencies** - Pure JavaScript
- 🚀 **Easy Integration** - Drop-in solution

## 📖 Documentation

**[View Full Documentation & Demo →](https://andreferra.github.io/docsify-plugin-interactive-checkboxes/)**

## 📦 Installation

### NPM

```bash
npm install docsify-interactive-checkboxes
```

### CDN

Add the script to your `index.html` after the Docsify script:

```html
<script src="https://cdn.jsdelivr.net/npm/docsify-interactive-checkboxes@2/dist/plugin.min.js"></script>
```

For production, pin an exact version and add a [Subresource Integrity](https://developer.mozilla.org/docs/Web/Security/Subresource_Integrity) hash (see the [Installation Guide](docs/installation.md)).



## 📝 Usage

Standard markdown syntax:

```markdown
- [ ] Unchecked task
- [x] Completed task
- [ ] Another task
```

## 📄 License

MIT License - see [LICENSE](LICENSE)