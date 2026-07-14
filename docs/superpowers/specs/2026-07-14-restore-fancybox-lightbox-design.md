# Restore Fancybox Lightbox Design

## Goal

Restore the Fancybox-based image lightbox that this site used before the optional-integration cleanup. Article images should once again open in an overlay and support navigation between images on the same page.

The restoration is intentionally limited to Fancybox. It must not restore `medium_zoom` or any other integration removed by the cleanup.

## Configuration

Restore the theme's `lightbox` configuration surface with `fancybox` as its only supported non-empty value:

- The theme sample/default configuration leaves `lightbox` disabled by default.
- The site's `/_config.butterfly.yml` override sets `lightbox: fancybox` so the feature is active on this site.
- Generated browser configuration exposes only the state needed to initialize Fancybox. No `medium_zoom` branch or asset is restored.

## Assets and Rendering

Restore Fancybox 6.1.9 JavaScript and CSS entries in the theme asset registry. The theme loads those assets only when `lightbox` is configured as `fancybox`.

Fancybox CSS is emitted in the document head. Fancybox JavaScript is loaded with the other theme runtime scripts before initialization can run. Disabled or unknown configuration values must not emit Fancybox assets.

## Browser Behavior

The existing theme runtime will regain a narrowly scoped Fancybox initializer:

- Eligible images inside `#article-container` are wrapped in a link to their full image URL when they are not already links.
- Generated links carry the Fancybox gallery attributes, image caption, and thumbnail URL.
- All eligible images on the current page belong to the same navigable gallery.
- Images whose primary purpose is navigation, including existing linked images and gallery-group covers, keep their link behavior and are not taken over by Fancybox.
- Dynamically rendered gallery images are initialized after the gallery finishes rendering.
- Initialization runs after normal page load and after the theme's existing PJAX lifecycle loads new content.
- Repeated initialization is idempotent: an image is not wrapped twice and Fancybox event binding is installed once per page runtime.

Captions use the existing image `title`, falling back to `alt`. Lazy-loaded images use their eventual image URL when available.

## Styling

Restore only the Fancybox-specific responsive adjustment needed by the previous implementation. Do not restore `medium_zoom` overlay variables, classes, or styling.

## Error and Compatibility Behavior

If Fancybox is disabled, its assets are unavailable, or a candidate image is already an external link, normal image and link behavior remains intact. The restoration must work with native and plugin-based lazy loading, existing gallery layout, and PJAX navigation without changing those features' public configuration.

## Testing

Update the optional-integration regression test so lightbox is no longer treated as a removed surface while all other removed integrations remain forbidden.

Add focused assertions that verify:

- The theme and site configuration expose only the Fancybox lightbox option.
- Fancybox 6.1.9 JavaScript and CSS assets are registered and conditionally loaded.
- Browser configuration and runtime initialization are present.
- The runtime excludes existing links and lightbox opt-out images, avoids duplicate wrapping, and initializes dynamic galleries.
- No `medium_zoom` configuration, asset, runtime branch, CSS class, or variable returns.

Run the full theme test suite and a clean Hexo generation. Inspect generated output to confirm that Fancybox assets and image bindings are emitted without reintroducing any unrelated removed integration.

## Non-Goals

- Restoring `medium_zoom` or a provider switcher.
- Reintroducing Snackbar, analytics, chat, advertising, visual effects, or any other removed integration.
- Redesigning the retained gallery tag or article image markup.
- Adding a new lightbox library or changing the previous Fancybox interaction model.
