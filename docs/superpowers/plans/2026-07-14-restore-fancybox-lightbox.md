# Restore Fancybox Lightbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the site's previous Fancybox image lightbox without restoring `medium_zoom` or any other removed integration.

**Architecture:** Reintroduce Fancybox as the theme's sole lightbox provider through the existing Butterfly configuration and asset registry. A guarded browser helper will decorate eligible article images and install one delegated Fancybox binding, while the existing initial-load, gallery-render, encrypted-content, and PJAX lifecycles call that helper.

**Tech Stack:** Hexo 8, Butterfly Pug templates, Stylus, browser JavaScript, Fancybox 6.1.9, Node.js built-in test runner

## Global Constraints

- Fancybox is the only supported non-empty `lightbox` value.
- Use `@fancyapps/ui` version `6.1.9` for both JavaScript and CSS.
- Do not restore `medium_zoom`, its configuration, asset, runtime branch, CSS classes, or variables.
- Existing linked images and `.no-lightbox` images keep their normal navigation behavior.
- Initial page load, dynamic galleries, encrypted content, and PJAX navigation must all initialize eligible images.
- Do not restore any other integration removed by commit `a8d0499`.

---

### Task 1: Restore the Fancybox configuration and asset surface

**Files:**
- Modify: `test/theme-surface.test.js`
- Modify: `_config.yml`
- Modify: `scripts/common/default_config.js`
- Modify: `plugins.yml`
- Modify: `layout/includes/head/config.pug`
- Modify: `layout/includes/head.pug`
- Modify: `layout/includes/additional-js.pug`
- Modify: `source/css/_layout/third-party.styl`

**Interfaces:**
- Consumes: Butterfly's existing `theme`, `theme.asset`, and `GLOBAL_CONFIG` conventions.
- Produces: `theme.lightbox`, `GLOBAL_CONFIG.lightbox`, `theme.asset.fancybox`, and `theme.asset.fancybox_css` for Task 2.

- [ ] **Step 1: Write the failing theme-surface test**

In `test/theme-surface.test.js`, remove `'lightbox'` from `removedKeys` and `/lightbox/i` from `removedRuntimePatterns`, then add this test immediately after `removed optional integrations have no theme surface`:

```js
test('Fancybox is the only restored lightbox provider', () => {
  const themeConfig = read('_config.yml')
  const defaults = read('scripts/common/default_config.js')
  const plugins = read('plugins.yml')
  const browserConfig = read('layout/includes/head/config.pug')
  const head = read('layout/includes/head.pug')
  const scripts = read('layout/includes/additional-js.pug')
  const styles = read('source/css/_layout/third-party.styl')

  assert.match(themeConfig, /^# Choose: fancybox\n# Leave it empty if you don't need lightbox\nlightbox:\s*$/m)
  assert.match(defaults, /^\s{2}lightbox: null,$/m)
  assert.match(browserConfig, /lightbox: '!\{ theme\.lightbox \|\| 'null' \}'/)

  assert.match(plugins, /^fancybox:\n\s+name: '@fancyapps\/ui'\n\s+file: dist\/fancybox\/fancybox\.umd\.js\n\s+version: 6\.1\.9\n\s+other_name: fancyapps-ui$/m)
  assert.match(plugins, /^fancybox_css:\n\s+name: '@fancyapps\/ui'\n\s+file: dist\/fancybox\/fancybox\.css\n\s+version: 6\.1\.9\n\s+other_name: fancyapps-ui$/m)
  assert.match(head, /if theme\.lightbox === 'fancybox'[\s\S]*theme\.asset\.fancybox_css/)
  assert.match(scripts, /if theme\.lightbox === 'fancybox'[\s\S]*theme\.asset\.fancybox/)
  assert.match(styles, /\.fancybox__toolbar__column\.is-middle/)

  const lightboxSurface = [themeConfig, defaults, plugins, browserConfig, head, scripts, styles].join('\n')
  assert.doesNotMatch(lightboxSurface, /medium_zoom|medium-zoom|mediumZoom/)
})
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
node --test --test-name-pattern='Fancybox is the only restored lightbox provider' test/theme-surface.test.js
```

Expected: FAIL on the first missing `lightbox` assertion because the restored surface does not exist yet.

- [ ] **Step 3: Restore the minimal configuration fields**

In `_config.yml`, insert this block after `photofigcaption: false`:

```yaml
# Lightbox
# Choose: fancybox
# Leave it empty if you don't need lightbox
lightbox:
```

In `scripts/common/default_config.js`, insert `lightbox: null` after `photofigcaption`:

```js
  photofigcaption: false,
  lightbox: null,
  copy: {
```

In `layout/includes/head/config.pug`, insert the browser field after `copyright`:

```pug
    copyright: !{copyright},
    lightbox: '!{ theme.lightbox || 'null' }',
    infinitegrid: {
```

- [ ] **Step 4: Register and conditionally load Fancybox 6.1.9**

In `plugins.yml`, add these entries after `egjs_infinitegrid`:

```yaml
fancybox:
  name: '@fancyapps/ui'
  file: dist/fancybox/fancybox.umd.js
  version: 6.1.9
  other_name: fancyapps-ui
fancybox_css:
  name: '@fancyapps/ui'
  file: dist/fancybox/fancybox.css
  version: 6.1.9
  other_name: fancyapps-ui
```

In `layout/includes/head.pug`, add the conditional stylesheet after the Font Awesome stylesheet:

```pug
if theme.lightbox === 'fancybox'
  link(rel='stylesheet' href=url_for(theme.asset.fancybox_css) media="print" onload="this.media='all'")
```

In `layout/includes/additional-js.pug`, add the conditional script after the translation script:

```pug
  if theme.lightbox === 'fancybox'
    script(src=url_for(theme.asset.fancybox))
```

At the end of `source/css/_layout/third-party.styl`, add only the former Fancybox responsive adjustment:

```stylus
+maxWidth768()
  .fancybox__toolbar__column.is-middle
    display: none
```

- [ ] **Step 5: Run the focused and full theme tests**

Run:

```bash
node --test --test-name-pattern='Fancybox is the only restored lightbox provider' test/theme-surface.test.js
npm test
```

Expected: both commands PASS; the optional-integration test continues to reject every previously removed integration except lightbox.

- [ ] **Step 6: Commit the theme surface**

```bash
git add test/theme-surface.test.js _config.yml scripts/common/default_config.js plugins.yml layout/includes/head/config.pug layout/includes/head.pug layout/includes/additional-js.pug source/css/_layout/third-party.styl
git commit -m "feat: restore Fancybox lightbox surface"
```

---

### Task 2: Restore Fancybox image binding across theme lifecycles

**Files:**
- Modify: `test/theme-surface.test.js`
- Modify: `source/js/utils.js`
- Modify: `source/js/main.js`
- Modify: `scripts/tag/gallery.js`
- Modify: `scripts/tag/flink.js`
- Modify: `layout/includes/page/flink.pug`
- Modify: `layout/includes/page/shuoshuo.pug`

**Interfaces:**
- Consumes: `GLOBAL_CONFIG.lightbox`, global `Fancybox`, `btf.wrap`, the gallery `renderComplete` event, and the existing `refreshFn`/PJAX lifecycle.
- Produces: `btf.loadLightbox(elements: NodeList|Element[]) -> void` and `runLightbox() -> void`.

- [ ] **Step 1: Write the failing runtime test**

Add this test after the Task 1 Fancybox test in `test/theme-surface.test.js`:

```js
test('Fancybox binds eligible article and dynamic gallery images', () => {
  const utils = read('source/js/utils.js')
  const main = read('source/js/main.js')
  const galleryTag = read('scripts/tag/gallery.js')
  const flinkTag = read('scripts/tag/flink.js')
  const flinkPage = read('layout/includes/page/flink.pug')
  const shuoshuo = read('layout/includes/page/shuoshuo.pug')

  assert.match(utils, /loadLightbox: elements =>/)
  assert.match(utils, /GLOBAL_CONFIG\.lightbox !== 'fancybox'/)
  assert.match(utils, /typeof Fancybox === 'undefined'/)
  assert.match(utils, /image\.closest\('a'\)/)
  assert.match(utils, /image\.classList\.contains\('no-lightbox'\)/)
  assert.match(utils, /image\.dataset\.lazySrc \|\| image\.src/)
  assert.match(utils, /'data-fancybox': 'gallery'/)
  assert.match(utils, /Fancybox\.bind\('\[data-fancybox="gallery"\]'/)
  assert.match(utils, /window\.fancyboxRun = true/)

  assert.match(main, /const runLightbox = \(\) =>[\s\S]*#article-container img:not\(\.no-lightbox\)/)
  assert.match(main, /handleRenderComplete[\s\S]*btf\.loadLightbox\(container\.querySelectorAll\('img:not\(\.no-lightbox\)'\)\)/)
  assert.match(main, /addJustifiedGallery\(document\.querySelectorAll\('#article-container \.gallery-container'\)\)\n\s+runLightbox\(\)/)
  assert.match(shuoshuo, /window\.lazyLoadInstance[\s\S]*btf\.loadLightbox\(document\.querySelectorAll\('#article-container img:not\(\.no-lightbox\)'\)\)/)

  for (const source of [galleryTag, flinkTag, flinkPage, shuoshuo]) {
    assert.match(source, /no-lightbox/)
  }

  assert.doesNotMatch([utils, main].join('\n'), /medium_zoom|medium-zoom|mediumZoom|medium-zoom-image/)
})
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
node --test --test-name-pattern='Fancybox binds eligible article and dynamic gallery images' test/theme-surface.test.js
```

Expected: FAIL because `btf.loadLightbox` is not defined.

- [ ] **Step 3: Add the guarded Fancybox helper**

In `source/js/utils.js`, insert this property after `getEleTop` and before `setLoading`:

```js
    loadLightbox: elements => {
      if (GLOBAL_CONFIG.lightbox !== 'fancybox' || typeof Fancybox === 'undefined') return

      elements.forEach(image => {
        if (image.closest('a') || image.classList.contains('no-lightbox')) return

        const dataSrc = image.dataset.lazySrc || image.src
        const dataCaption = image.title || image.alt || ''
        btf.wrap(image, 'a', {
          href: dataSrc,
          'data-fancybox': 'gallery',
          'data-caption': dataCaption,
          'data-thumb': dataSrc
        })
      })

      if (window.fancyboxRun) return

      Fancybox.bind('[data-fancybox="gallery"]', {
        Hash: false,
        Carousel: {
          transition: 'slide',
          Thumbs: {
            showOnStart: false
          },
          Toolbar: {
            display: {
              left: ['counter'],
              middle: [
                'zoomIn',
                'zoomOut',
                'toggle1to1',
                'rotateCCW',
                'rotateCW',
                'flipX',
                'flipY',
                'reset'
              ],
              right: ['autoplay', 'thumbs', 'close']
            }
          },
          Zoomable: {
            Panzoom: {
              maxScale: 4
            }
          }
        }
      })
      window.fancyboxRun = true
    },
```

This differs from the pre-cleanup helper only by removing the `medium_zoom` branch, guarding an unavailable Fancybox global, using `closest('a')` for nested linked images, and binding only the `gallery` group.

- [ ] **Step 4: Restore initial, gallery, encrypted-content, and PJAX initialization**

In `source/js/main.js`, insert this helper after `addPhotoFigcaption`:

```js
  /**
   * Lightbox
   */
  const runLightbox = () => {
    btf.loadLightbox(document.querySelectorAll('#article-container img:not(.no-lightbox)'))
  }
```

Inside `handleRenderComplete`, after the `updated`/`mounted` guard and before the group-count branch, add:

```js
      btf.loadLightbox(container.querySelectorAll('img:not(.no-lightbox)'))
```

Inside `forPostFn`, call `runLightbox()` immediately after starting gallery initialization:

```js
    addJustifiedGallery(document.querySelectorAll('#article-container .gallery-container'))
    runLightbox()
```

No separate PJAX listener is required: `refreshFn` already calls `forPostFn` and is already registered through `btf.addGlobalFn('pjaxComplete', refreshFn, 'refreshFn')`. The existing `hexo-blog-decrypt` listener also calls `forPostFn`.

- [ ] **Step 5: Restore navigation-image opt-outs and shuoshuo initialization**

In `scripts/tag/gallery.js`, restore the gallery-group cover class:

```js
    <img class="gallery-group-img no-lightbox" src='${urlFor(img)}' alt="Group Image Gallery">
```

In `scripts/tag/flink.js`, restore the friend avatar class:

```js
            <img class="no-lightbox" src="${link.avatar}" onerror='this.onerror=null;this.src="${urlFor(hexo.theme.config.error_img.flink)}"' alt="${link.name}" />
```

In both friend-avatar templates in `layout/includes/page/flink.pug`, add `class="no-lightbox"` to the `<img>` element without changing any other attributes.

In `layout/includes/page/shuoshuo.pug`, mark the author avatar as an opt-out:

```html
                      <img class="no-lightbox" src="${item.avatar || '!{url_for(theme.avatar.img)}'}">
```

Then initialize the newly rendered shuoshuo content immediately after lazy-load refresh:

```js
          window.lazyLoadInstance && window.lazyLoadInstance.update()
          btf.loadLightbox(document.querySelectorAll('#article-container img:not(.no-lightbox)'))
```

- [ ] **Step 6: Run focused and full theme tests**

Run:

```bash
node --test --test-name-pattern='Fancybox binds eligible article and dynamic gallery images' test/theme-surface.test.js
npm test
```

Expected: both commands PASS, and the test output contains no failures for removed integrations.

- [ ] **Step 7: Commit the runtime restoration**

```bash
git add test/theme-surface.test.js source/js/utils.js source/js/main.js scripts/tag/gallery.js scripts/tag/flink.js layout/includes/page/flink.pug layout/includes/page/shuoshuo.pug
git commit -m "feat: restore Fancybox image binding"
```

---

### Task 3: Enable Fancybox for the site and verify the generated blog

**Files:**
- Create: `/Users/iuxt/code/zahuifan/test/fancybox-config.test.js`
- Modify: `/Users/iuxt/code/zahuifan/package.json`
- Modify: `/Users/iuxt/code/zahuifan/_config.butterfly.yml`
- Modify: `/Users/iuxt/code/zahuifan/themes/butterfly` (submodule pointer)

**Interfaces:**
- Consumes: the completed Fancybox-only theme surface and runtime from Tasks 1 and 2.
- Produces: an active `lightbox: fancybox` site override and generated HTML that loads Fancybox 6.1.9.

- [ ] **Step 1: Add a failing site-configuration test**

Add a root test script to `/Users/iuxt/code/zahuifan/package.json`:

```json
  "scripts": {
    "test": "node --test",
    "build": "hexo generate",
    "clean": "hexo clean",
    "deploy": "hexo deploy",
    "server": "hexo server",
    "s": "hexo clean && hexo s"
  },
```

Create `/Users/iuxt/code/zahuifan/test/fancybox-config.test.js`:

```js
'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const root = path.join(__dirname, '..')

test('site enables the Fancybox lightbox', () => {
  const config = fs.readFileSync(path.join(root, '_config.butterfly.yml'), 'utf8')

  assert.match(config, /^lightbox: fancybox$/m)
  assert.doesNotMatch(config, /medium_zoom|medium-zoom|mediumZoom/)
})
```

- [ ] **Step 2: Run the root test to verify it fails**

Run from `/Users/iuxt/code/zahuifan`:

```bash
npm test
```

Expected: FAIL because `_config.butterfly.yml` does not yet enable Fancybox.

- [ ] **Step 3: Enable Fancybox in the active site override**

In `/Users/iuxt/code/zahuifan/_config.butterfly.yml`, insert this block after `activate_power_mode` and before the tag-plugin settings:

```yaml
# Image lightbox
lightbox: fancybox
```

- [ ] **Step 4: Run the root and theme tests**

Run:

```bash
cd /Users/iuxt/code/zahuifan && npm test
cd /Users/iuxt/code/zahuifan/themes/butterfly && npm test
```

Expected: both test suites PASS.

- [ ] **Step 5: Generate the site from a clean output directory**

Run:

```bash
cd /Users/iuxt/code/zahuifan
npm run clean
npm run build
```

Expected: Hexo reports successful generation with no Pug, Stylus, or JavaScript errors.

- [ ] **Step 6: Inspect the generated Fancybox surface and excluded integrations**

Run:

```bash
rg -n "fancybox.*6\.1\.9|6\.1\.9.*fancybox|lightbox: 'fancybox'|loadLightbox" public --glob '*.html' --glob '*.js'
rg -n -i "medium[_-]?zoom|mediumZoom" public --glob '*.html' --glob '*.js' --glob '*.css'
```

Expected: the first command finds Fancybox 6.1.9 assets, `GLOBAL_CONFIG.lightbox`, and the `loadLightbox` runtime; the second command returns no matches.

- [ ] **Step 7: Review the final diffs and repository state**

Run:

```bash
git -C /Users/iuxt/code/zahuifan/themes/butterfly diff --check
git -C /Users/iuxt/code/zahuifan diff --check
git -C /Users/iuxt/code/zahuifan/themes/butterfly status --short
git -C /Users/iuxt/code/zahuifan status --short
```

Expected: both `diff --check` commands produce no output. The theme repository is clean after its Task 1 and Task 2 commits; the root repository shows only `_config.butterfly.yml`, `package.json`, `test/fancybox-config.test.js`, and the updated `themes/butterfly` submodule pointer.

- [ ] **Step 8: Commit the active site restoration**

```bash
cd /Users/iuxt/code/zahuifan
git add _config.butterfly.yml package.json test/fancybox-config.test.js themes/butterfly
git commit -m "feat: restore Fancybox image lightbox"
```
