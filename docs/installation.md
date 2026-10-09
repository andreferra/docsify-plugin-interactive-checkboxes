# 📦 Installation

There are two ways to install the Interactive Checkboxes plugin: via NPM or using a CDN.

## Option 1: NPM (Recommended for Bundlers)

If you are using a bundler or a Node.js-based setup, you can install the package via npm.

```bash
npm install docsify-interactive-checkboxes
```

Then, import it in your main script file if your setup supports it, or reference the file from `node_modules`.

## Option 2: CDN (Easiest)

For most Docsify sites, you can simply add the script tag to your `index.html`. This requires no build step.

Add the following script **after** the main Docsify script:

```html
<script src="https://cdn.jsdelivr.net/npm/docsify-interactive-checkboxes@2/dist/plugin.min.js"></script>
```

### Production: pin an exact version with SRI

Loading a version range (or no version at all) means a new release is picked up automatically. For production sites, pin an exact version and add a [Subresource Integrity](https://developer.mozilla.org/docs/Web/Security/Subresource_Integrity) hash, so the browser refuses to run the file if it ever changes:

```html
<script src="https://cdn.jsdelivr.net/npm/docsify-interactive-checkboxes@2.0.1/dist/plugin.min.js"
        integrity="sha384-<hash>" crossorigin="anonymous"></script>
```

Generate the hash for the exact file you reference:

```bash
curl -s https://cdn.jsdelivr.net/npm/docsify-interactive-checkboxes@2.0.1/dist/plugin.min.js \
  | openssl dgst -sha384 -binary | openssl base64 -A
```

### Development Version
If you want to use the latest unstable changes from the main branch (not recommended for production):

```html
<script src="https://cdn.jsdelivr.net/gh/andreferra/docsify-plugin-interactive-checkboxes/src/plugin.js"></script>
```
