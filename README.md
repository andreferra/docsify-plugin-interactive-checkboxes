# Docsify Interactive Checkboxes Plugin

A lightweight Docsify plugin that transforms standard markdown checkboxes into interactive, persistent task lists.

## ✨ Features

- 🖱️ **Interactive Checkboxes** - Click to toggle task completion
- 💾 **Persistent State** - Checkbox states saved in browser localStorage
- 📄 **Per-Page Storage** - Each page maintains its own checkbox states
- 🎨 **Visual Feedback** - Completed tasks show strikethrough styling
- ⚡ **Zero Dependencies** - Pure JavaScript, no external libraries
- 🚀 **Easy Integration** - Drop-in solution for existing Docsify sites

## 📦 Installation

### Option 1: Direct Integration

Add the plugin directly to your `index.html`:

```html
<script>
  window.$docsify = {
    // ... your existing config
    
    plugins: [
      function(hook, vm) {
        // Storage key prefix
        const STORAGE_PREFIX = 'docsify-checkbox-';
        
        function getStorageKey() {
          return STORAGE_PREFIX + (vm.route.path || 'index');
        }
        
        function loadCheckboxStates() {
          const key = getStorageKey();
          const stored = localStorage.getItem(key);
          return stored ? JSON.parse(stored) : {};
        }
        
        function saveCheckboxStates(states) {
          const key = getStorageKey();
          localStorage.setItem(key, JSON.stringify(states));
        }
        
        hook.doneEach(function() {
          const checkboxes = document.querySelectorAll('.task-list-item input[type="checkbox"]');
          const states = loadCheckboxStates();
          
          checkboxes.forEach((checkbox, index) => {
            const checkboxId = 'checkbox-' + index;
            checkbox.id = checkboxId;
            
            if (states[checkboxId] !== undefined) {
              checkbox.checked = states[checkboxId];
              if (checkbox.checked) {
                checkbox.parentElement.classList.add('checked');
              }
            }
            
            checkbox.removeAttribute('disabled');
            
            checkbox.addEventListener('change', function(e) {
              const isChecked = e.target.checked;
              const listItem = e.target.parentElement;
              
              if (isChecked) {
                listItem.classList.add('checked');
              } else {
                listItem.classList.remove('checked');
              }
              
              const currentStates = loadCheckboxStates();
              currentStates[checkboxId] = isChecked;
              saveCheckboxStates(currentStates);
            });
          });
        });
      }
    ]
  }
</script>
```

### Option 2: External Script (Coming Soon)

```html
<script src="//cdn.jsdelivr.net/npm/docsify-interactive-checkboxes/dist/plugin.min.js"></script>
```

## 🎨 Styling (Optional)

Add custom styles to your `index.html`:

```html
<style>
  .task-list-item {
    list-style-type: none;
    margin-left: -1.5em;
  }
  
  .task-list-item input[type="checkbox"] {
    margin-right: 0.5em;
    cursor: pointer;
    width: 16px;
    height: 16px;
  }
  
  .task-list-item.checked {
    opacity: 0.6;
  }
  
  .task-list-item.checked label {
    text-decoration: line-through;
  }
</style>
```

## 📖 Usage

Simply use standard markdown checkbox syntax in your `.md` files:

```markdown
## My Tasks

### Project Setup
- [ ] Initialize repository
- [ ] Install dependencies
- [ ] Configure build tools

### Development
- [x] Design architecture
- [ ] Implement core features
- [ ] Write tests
- [ ] Review code

### Deployment
- [ ] Setup CI/CD
- [ ] Deploy to staging
- [ ] Deploy to production
```

The plugin will automatically:
1. Make all checkboxes interactive
2. Save their state when clicked
3. Restore state on page reload
4. Apply visual styling to completed tasks

## 🎯 Use Cases

Perfect for:
- 📚 **Learning guides** - Track progress through tutorials
- 📝 **Interview prep** - Checklist for technical questions
- 🎓 **Course materials** - Monitor student completion
- 📋 **Documentation** - Interactive task lists in guides
- 🔧 **Setup instructions** - Step-by-step configuration tracking

## 🔧 Configuration

### Custom Storage Key Prefix

Modify the `STORAGE_PREFIX` to avoid conflicts:

```javascript
const STORAGE_PREFIX = 'my-custom-prefix-';
```

### Clear All States

Add a reset function to clear all checkbox states:

```javascript
function clearAllCheckboxes() {
  Object.keys(localStorage)
    .filter(key => key.startsWith('docsify-checkbox-'))
    .forEach(key => localStorage.removeItem(key));
  location.reload();
}
```

## 🌐 Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Opera (latest)

Requires localStorage support (available in all modern browsers).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 🐛 [Report bugs](https://github.com/andreferra/docsify-plugin-interactive-checkboxes/issues)
- 💡 [Request features](https://github.com/andreferra/docsify-plugin-interactive-checkboxes/issues)
- ⭐ Star this repo if you find it useful!

---

**Made with ❤️ for the Docsify community**