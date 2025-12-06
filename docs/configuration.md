# ⚙️ Configuration

## Plugin Options

Configure the plugin in your Docsify config:

```javascript
window.$docsify = {
  interactiveCheckboxes: {
    storagePrefix: 'docsify-checkbox-', // localStorage key prefix
    fadeCompleted: true,                 // fade completed items
    fadeOpacity: 0.6,                    // opacity for completed items
    cleanOrphanedStates: true            // remove states for deleted checkboxes (v2+)
  }
}
```

> [!NOTE]
> **v2.0 Update**: Checkbox IDs are now generated based on their content hash. This ensures states are preserved correctly even if you reorder list items!

## Custom Storage Prefix

Avoid conflicts with other apps using the same localStorage:

```javascript
interactiveCheckboxes: {
  storagePrefix: 'my-custom-prefix-'
}
```

## Utility Functions

The plugin exposes these global functions for managing states:

### 📤 Export/Import States (v2+)

Useful for backing up or transferring progress:

```javascript
// Export all states as an object
const backup = exportDocsifyCheckboxStates();
console.log(backup);

// Import states
importDocsifyCheckboxStates(backup);
```

### 📊 Get Progress

```javascript
const progress = getDocsifyCheckboxProgress();
console.log(progress);
// { total: 10, checked: 3, percentage: 30 }
```

### 🧹 Clear All Checkboxes

```javascript
// Reset all checkbox states and reload
clearAllDocsifyCheckboxes();

// With custom prefix
clearAllDocsifyCheckboxes('my-prefix-');
```

## Custom Events

Listen to checkbox changes:

```javascript
document.addEventListener('docsify-checkbox-change', function(e) {
  console.log('Checkbox changed:', e.detail);
  /* Output:
  { 
    checkboxId: 'cb-k8j29-0', 
    checked: true, 
    page: '/demo',
    progress: { total: 5, checked: 1, percentage: 20 } 
  }
  */
});
```

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Opera (latest)

Requires localStorage support.
