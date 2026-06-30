# kss-tailwindcss

A Tailwind CSS powered builder for [kss-node](https://github.com/kss-node/kss). It produces a static, offline-friendly documentation UI with responsive navigation, local search, theme controls, copy buttons, accessible focus states, and readable API reference pages.

The package is built for `kss@3.1.x` and exports a CommonJS KSS builder from `builder.js`.

## Install

```sh
npm install --save-dev kss@^3.1.0 kss-tailwindcss
```

The generated style guide is static. Consumers do not need Tailwind at runtime because the compiled theme CSS ships in `kss-assets/kss-theme.css`.

## Configure KSS

In `kss-config.json`, point `builder` at the installed package directory:

```json
{
  "title": "Design System",
  "source": "src/",
  "homepage": "src/homepage.md",
  "destination": "docs/",
  "builder": "node_modules/kss-tailwindcss"
}
```

KSS resolves `builder` values from config files as directories relative to the config file before it loads the builder module. For that reason, use `node_modules/kss-tailwindcss` in JSON config files.

Add a package script:

```json
{
  "scripts": {
    "docs": "kss --config kss-config.json"
  }
}
```

Then build:

```sh
npm run docs
```

## Programmatic Use

When calling KSS from JavaScript, the package name can be passed directly:

```js
const kss = require("kss");

kss({
  title: "Design System",
  source: ["src/"],
  homepage: "src/homepage.md",
  destination: "docs/",
  builder: "kss-tailwindcss",
});
```

## KSS Comments

Write ordinary KSS comments in your source files:

```css
/*
Button

Primary action button.

Markup:
<button class="button">Save</button>

Styleguide Components.Button
*/
.button {
  display: inline-flex;
}
```

The builder renders:

- Overview and section pages
- Individual item pages
- Sidebar navigation and current-page table of contents
- Parameters, colors, examples, markup, and source links
- Deprecated, experimental, and private badges
- Empty states for sections without descriptions or markup

## Static Assets

KSS copies the package's `kss-assets/` directory into your configured destination.

Included assets:

- `kss-theme.css`: compiled Tailwind CSS theme
- `kss-theme.js`: search, drawer, copy buttons, theme toggle, guide toggle, and current-section highlighting
- `favicon.svg`: default style guide icon

No CDN scripts or styles are required.

## Browser Features

The generated docs include:

- Local search over the generated KSS index
- Persistent light, dark, and system theme modes
- Mobile navigation drawer
- Copy buttons for markup blocks
- Example guide toggle
- Section highlighting while scrolling
- Accessible landmarks, labels, and focus states

## Customizing The Theme

The source CSS lives in `src/kss-theme.css`. After editing it, rebuild the compiled asset:

```sh
npm run build
```

Template changes live in `index.hbs`. Builder behavior and Handlebars helpers live in `builder.js`.

The publish package includes both the compiled assets and the Tailwind source so a downstream repo can rebuild the theme without recovering hidden files.

## Package Structure

```text
kss-tailwindcss/
  builder.js
  index.hbs
  kss-assets/
    favicon.svg
    kss-theme.css
    kss-theme.js
  src/
    kss-theme.css
  package.json
  README.md
```

## Development

Install dependencies:

```sh
npm install
```

Build the theme:

```sh
npm run build
```

Check the npm package contents before publishing:

```sh
npm run pack:check
```

## Publishing

Before publishing from the extracted repository:

1. Verify `name` is `kss-tailwindcss`.
2. Update `version` in `package.json`.
3. Confirm `repository`, `bugs`, and `homepage` point to the extracted repository.
4. Run `npm install`.
5. Run `npm run build`.
6. Run `npm run pack:check`.
7. Publish with `npm publish --access public`.

## Compatibility

- KSS builder API: `kss@3.1.x`
- Module format: CommonJS
- Node.js: 18 or newer
- Runtime browser dependencies: none

## License

ISC
