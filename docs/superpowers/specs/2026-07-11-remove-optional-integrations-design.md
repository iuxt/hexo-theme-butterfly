# Remove Optional Integrations Design

## Goal

Permanently remove the following capabilities from this Butterfly theme fork and from the site's theme override: Chart.js, Snackbar, ABCJS, lightbox, canvas fluttering ribbon, canvas nest, fireworks, click heart, click-show-text, canvas ribbon, site verification, custom advertising, Google AdSense, Google Tag Manager, Baidu Analytics, Google Analytics, Cloudflare Analytics, Microsoft Clarity, Umami Analytics, and live chat.

Removal means these capabilities are no longer configurable, rendered, loaded, documented, or exposed through theme runtime code.

## Scope

The change will remove:

- Public settings from the site override, the theme sample configuration, and the JavaScript default configuration.
- Pug templates and includes dedicated to the removed integrations.
- The Chart.js Hexo tag implementation and all Chart.js-specific rendering and styles.
- Runtime hooks for Snackbar, lightbox, chat controls, analytics counters, advertisements, and visual effects.
- Plugin/CDN asset declarations that exist only for the removed capabilities.
- Translation strings and README feature claims that advertise the removed capabilities.
- The site's `ads.txt`, because the repository will no longer support advertising.

The change will not remove `hexo-butterfly-extjs`. That package also supplies assets for retained features such as Font Awesome, Mermaid, KaTeX, and Pjax. Consequently, packages such as `abcjs`, `chart.js`, and `node-snackbar` may remain as transitive entries in the root lockfile even though the theme no longer exposes or loads them.

## Runtime Behavior

Snackbar calls will be removed rather than replaced with another toast library. Copying, dark-mode switching, and Chinese conversion will continue to perform their primary actions without toast feedback.

Images will render normally without click-to-zoom behavior. Gallery and friend-link markup will no longer emit lightbox-specific opt-out classes.

Chat buttons and provider embeds will disappear. Default right-side ordering will no longer include a chat item, while the remaining right-side controls will keep their existing order and behavior.

Advertising slots, verification metadata, analytics scripts, analytics preconnect hints, and analytics-derived counters will not be emitted. Existing Busuanzi counters remain available because Busuanzi is outside the requested deletion list.

## Implementation Boundaries

Shared files will be edited narrowly:

- General JavaScript utilities will lose only Snackbar and lightbox helpers and their call sites.
- Header and footer assembly will lose only includes and conditions belonging to removed integrations.
- Post metadata and site statistics will retain non-Umami fallback behavior.
- The asset registry will retain every entry still referenced by supported features.
- Unrelated theme functionality and content will not be refactored.

## Verification

A regression test will enumerate the removed surface and assert that:

- Dedicated implementation files and directories no longer exist.
- Removed configuration keys do not appear in either theme configuration source.
- Removed template includes, global configuration fields, runtime helper names, styles, translations, and plugin asset keys are absent.
- Retained fallbacks such as Busuanzi remain present.

Verification will run the theme's Node test suite and a clean Hexo site generation. A final repository-wide search will distinguish acceptable lockfile-only transitive package names from any remaining theme capability reference.
