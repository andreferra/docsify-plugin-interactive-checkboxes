# ⚙️ Configuration

## Plugin Options

Configure the plugin in your Docsify config:

```javascript
window.$docsify = {
  interactiveCheckboxes: {
    storagePrefix: 'docsify-checkbox-',  // localStorage key prefix
    fadeCompleted: true,                  // fade completed items
    fadeOpacity: 0.6                      // opacity for completed items
  }
}
```

## Custom Storage Prefix

Avoid conflicts with other apps using the same localStorage:

```javascript
interactiveCheckboxes: {
  storagePrefix: 'my-custom-prefix-'
}
```

## Utility Functions

The plugin exposes these global functions:

### Clear All Checkboxes

```javascript
// Reset all checkbox states and reload
clearAllDocsifyCheckboxes();

// With custom prefix
clearAllDocsifyCheckboxes('my-prefix-');
```

### Get Progress

```javascript
const progress = getDocsifyCheckboxProgress();
console.log(progress);
// { total: 10, checked: 3, percentage: 30 }
```

## Custom Events

Listen to checkbox changes:

```javascript
document.addEventListener('docsify-checkbox-change', function(e) {
  console.log('Checkbox changed:', e.detail);
  // { checkboxId: 'checkbox-0', checked: true, page: '/demo' }
});
```

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Opera (latest)

Requires localStorage support.
