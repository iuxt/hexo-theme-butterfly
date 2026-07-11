# Remove Optional Integrations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permanently remove the approved optional integrations from the Butterfly theme fork and the site's active theme override.

**Architecture:** Treat the theme surface as four boundaries: configuration, rendering, browser runtime, and documentation/assets. Add a filesystem-and-content regression test first, then remove each boundary narrowly while preserving unrelated fallbacks such as Busuanzi and the retained `hexo-butterfly-extjs` package.

**Tech Stack:** Hexo 8, Pug, Stylus, browser JavaScript, YAML, Node's built-in test runner.

## Global Constraints

- Remove Chart.js, Snackbar, ABCJS, lightbox, canvas fluttering ribbon, canvas nest, fireworks, click heart, click-show-text, canvas ribbon, site verification, custom advertising, Google AdSense, Google Tag Manager, Baidu Analytics, Google Analytics, Cloudflare Analytics, Microsoft Clarity, Umami Analytics, and live chat.
- Do not remove `hexo-butterfly-extjs`; retained theme features still consume it.
- Remove Snackbar feedback without introducing a replacement notification library.
- Retain Busuanzi counters and all unrelated theme behavior.
- Delete the root site's `source/ads.txt`.

## File Structure

- `test/theme-surface.test.js`: regression contract for the reduced integration surface.
- `_config.yml`, `scripts/common/default_config.js`, and root `/_config.butterfly.yml`: public and default configuration surfaces.
- `plugins.yml`: CDN assets addressable by supported theme code.
- `layout/**`: server-rendered integration entry points and dedicated templates.
- `source/js/**`: shared browser behavior after Snackbar, lightbox, and chat removal.
- `source/css/**`: retained feature styles and variables only.
- `languages/*.yml`, `README.md`, and `README_CN.md`: user-facing descriptions of supported features.

---

### Task 1: Add the removal regression contract

**Files:**
- Modify: `test/theme-surface.test.js`

**Interfaces:**
- Consumes: repository files through the existing `root` and `read()` helpers.
- Produces: a test named `removed optional integrations have no theme surface` that all later tasks must satisfy.

- [ ] **Step 1: Write the failing test**

Append a test that defines the removed keys and dedicated paths, asserts every path is absent, asserts configuration keys are absent from `_config.yml` and `scripts/common/default_config.js`, and scans runtime files for the integration identifiers. Explicitly assert `busuanzi` remains in `scripts/common/default_config.js`.

```js
test('removed optional integrations have no theme surface', () => {
  const removedPaths = [
    'scripts/tag/chartjs.js',
    'layout/includes/third-party/abcjs',
    'layout/includes/third-party/chat',
    'layout/includes/third-party/math/chartjs.pug',
    'layout/includes/third-party/umami_analytics.pug',
    'layout/includes/head/analytics.pug',
    'layout/includes/head/google_adsense.pug',
    'layout/includes/head/site_verification.pug',
    'layout/includes/widget/card_ad.pug',
    'source/css/_layout/chat.styl'
  ]
  for (const file of removedPaths) assert.equal(fs.existsSync(path.join(root, file)), false, file)

  const removedKeys = [
    'chartjs', 'snackbar', 'abcjs', 'lightbox', 'canvas_fluttering_ribbon',
    'canvas_nest', 'fireworks', 'click_heart', 'clickShowText', 'canvas_ribbon',
    'site_verification', 'ad', 'google_adsense', 'google_tag_manager',
    'baidu_analytics', 'google_analytics', 'cloudflare_analytics',
    'microsoft_clarity', 'umami_analytics', 'chat', 'chatra', 'tidio', 'crisp'
  ]
  for (const file of ['_config.yml', 'scripts/common/default_config.js']) {
    const config = read(file)
    for (const key of removedKeys) {
      assert.doesNotMatch(config, new RegExp(`^\\s*${key}:`, 'm'), `${file}: ${key}`)
    }
  }

  const runtime = [
    'layout/includes/head.pug', 'layout/includes/additional-js.pug',
    'layout/includes/head/config.pug', 'layout/includes/rightside.pug',
    'source/js/main.js', 'source/js/utils.js', 'source/js/tw_cn.js',
    'source/css/_layout/third-party.styl', 'plugins.yml'
  ].map(read).join('\n')
  const removedRuntimePatterns = [
    /chartjs/i, /snackbar/i, /abcjs/i, /lightbox/i, /canvas_fluttering_ribbon/,
    /canvas_nest/, /fireworks/, /click_heart/, /clickShowText/, /canvas_ribbon/,
    /site_verification/, /google_adsense/, /google_tag_manager/, /baidu_analytics/,
    /google_analytics/, /cloudflare_analytics/, /microsoft_clarity/,
    /umami_analytics/, /theme\.ad\b/, /theme\.chat\b/, /chat-btn/
  ]
  for (const pattern of removedRuntimePatterns) assert.doesNotMatch(runtime, pattern)
  assert.match(read('scripts/common/default_config.js'), /busuanzi/)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --test-name-pattern='removed optional integrations'`

Expected: FAIL because the dedicated files and configuration keys still exist.

- [ ] **Step 3: Commit the failing contract with the first implementation batch rather than leaving the branch red**

Do not commit at this step. The test becomes green in Tasks 2-4 and is committed with those changes.

---

### Task 2: Remove configuration and asset exposure

**Files:**
- Modify: `_config.yml`
- Modify: `scripts/common/default_config.js`
- Modify: `plugins.yml`
- Modify: `layout/includes/head/config.pug`
- Modify: root `/_config.butterfly.yml`

**Interfaces:**
- Consumes: the exact removed-key list from Task 1.
- Produces: a merged theme configuration and `GLOBAL_CONFIG` with no removed integration fields.

- [ ] **Step 1: Delete configuration blocks**

Remove the complete YAML and JavaScript object blocks for the approved integrations. In `rightside_item_order` comments/default examples, remove `chat`. In the CDN option examples and `plugins.yml`, remove only asset entries belonging to the approved list. Preserve `activate_power_mode`, Mermaid, KaTeX, Pjax, Busuanzi, and all other entries.

- [ ] **Step 2: Remove browser-global configuration fields**

Delete construction of the `Snackbar` JSON object and remove these properties from `GLOBAL_CONFIG`:

```js
lightbox: '...',
Snackbar: ...,
```

- [ ] **Step 3: Remove active site overrides**

Delete the corresponding blocks and comments from root `/_config.butterfly.yml`, including the active `google_analytics` value. Preserve social share values containing `wechat`; they are not chat integrations.

- [ ] **Step 4: Run the focused test**

Run: `npm test -- --test-name-pattern='removed optional integrations'`

Expected: FAIL only on dedicated files and runtime/template references, not configuration assertions.

---

### Task 3: Remove rendering implementations and entry points

**Files:**
- Delete: `scripts/tag/chartjs.js`
- Delete: `layout/includes/third-party/abcjs/`
- Delete: `layout/includes/third-party/chat/`
- Delete: `layout/includes/third-party/math/chartjs.pug`
- Delete: `layout/includes/third-party/umami_analytics.pug`
- Delete: `layout/includes/head/analytics.pug`
- Delete: `layout/includes/head/google_adsense.pug`
- Delete: `layout/includes/head/site_verification.pug`
- Delete: `layout/includes/widget/card_ad.pug`
- Modify: `layout/includes/head.pug`
- Modify: `layout/includes/additional-js.pug`
- Modify: `layout/includes/third-party/effect.pug`
- Modify: `layout/includes/third-party/math/index.pug`
- Modify: `layout/includes/third-party/pjax.pug`
- Modify: `layout/includes/rightside.pug`
- Modify: `layout/includes/header/post-info.pug`
- Modify: `layout/includes/widget/card_webinfo.pug`
- Modify: `layout/includes/widget/index.pug`
- Modify: `layout/includes/mixins/indexPostUI.pug`
- Modify: `layout/post.pug`

**Interfaces:**
- Consumes: supported theme settings remaining after Task 2.
- Produces: Pug output with no removed integration HTML, scripts, metadata, counters, buttons, or advertisement slots.

- [ ] **Step 1: Delete dedicated implementations**

Delete every dedicated file and directory listed above. Keep `layout/includes/third-party/effect.pug` because it still renders `activate_power_mode`; remove only the requested canvas and click-effect branches from it.

- [ ] **Step 2: Remove template entry points**

Remove includes and conditions for site verification, analytics, AdSense, Snackbar CSS, lightbox assets, ABCJS, chat, Umami, Chart.js, effects that were deleted, custom ad slots, and Google Tag Manager's noscript iframe.

- [ ] **Step 3: Preserve non-Umami counter fallbacks**

In post info and the web-info card, remove the Umami-first branches and promote the existing Busuanzi conditions to the primary `if` branches. Do not alter Busuanzi element IDs or labels.

- [ ] **Step 4: Remove chat from right-side rendering**

Remove `chat` from the destructuring assignment, the `when 'chat'` case, and the default show array:

```pug
- const { readmode, translate, darkmode, aside } = theme
- const showArray = enable && show ? show.split(',') : ['toc','comment']
```

- [ ] **Step 5: Run the focused test**

Run: `npm test -- --test-name-pattern='removed optional integrations'`

Expected: FAIL only on remaining JavaScript, CSS, translation, or documentation references.

---

### Task 4: Remove browser runtime, styles, and user-facing remnants

**Files:**
- Modify: `source/js/utils.js`
- Modify: `source/js/main.js`
- Modify: `source/js/tw_cn.js`
- Modify: `layout/includes/page/shuoshuo.pug`
- Modify: `scripts/tag/flink.js`
- Modify: `scripts/tag/gallery.js`
- Modify: `layout/includes/page/flink.pug`
- Delete: `source/css/_layout/chat.styl`
- Modify: `source/css/_layout/third-party.styl`
- Modify: `source/css/_global/function.styl`
- Modify: `source/css/var.styl`
- Modify: `languages/default.yml`
- Modify: `languages/en.yml`
- Modify: `languages/ja.yml`
- Modify: `languages/ko.yml`
- Modify: `languages/zh-CN.yml`
- Modify: `languages/zh-HK.yml`
- Modify: `languages/zh-TW.yml`
- Modify: `README.md`
- Modify: `README_CN.md`
- Delete: root `/source/ads.txt`

**Interfaces:**
- Consumes: DOM produced by Task 3 without chat, lightbox, or Snackbar assets.
- Produces: browser code that never reads or invokes those removed globals.

- [ ] **Step 1: Remove Snackbar runtime calls**

Delete `btf.snackbarShow` from `utils.js`. Remove its guarded calls from copy handling and dark-mode switching in `main.js`. Remove Snackbar state and calls from `tw_cn.js`; retain the language conversion itself.

- [ ] **Step 2: Remove lightbox runtime calls**

Delete `btf.loadLightbox`, `runLightbox`, and all invocations. In dynamic gallery/shuoshuo code, remove lightbox initialization. Remove `no-lightbox` and `medium-zoom-image` selectors/classes that existed only for lightbox behavior while preserving image markup.

- [ ] **Step 3: Remove chat scrolling integration**

Delete `chatBtn` discovery, hide/show calls, and the `chat-btn` click dispatcher from `main.js`.

- [ ] **Step 4: Remove feature-specific styles and language strings**

Delete chat, fireworks, Chart.js, Snackbar, ABCJS, Fancybox/medium-zoom, and canvas-ribbon-specific CSS/variables/functions. Remove `rightside.chat` and the top-level `Snackbar` translation block from every language file.

- [ ] **Step 5: Update documentation and advertising artifact**

Remove the existing README checklist claims for live chat, advertising, mouse effects, image lightbox, ABCJS, Chart.js, and Snackbar. If one language README does not contain a specific claim, make no replacement text. Delete root `source/ads.txt`.

- [ ] **Step 6: Run the focused and full theme tests**

Run: `npm test -- --test-name-pattern='removed optional integrations'`

Expected: PASS.

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 7: Commit the theme implementation**

```bash
git add -A
git commit -m "refactor: remove optional integrations"
```

Run this in `themes/butterfly`. Root site configuration and `source/ads.txt` remain for the root commit.

---

### Task 5: Verify the generated site and commit root integration changes

**Files:**
- Verify: all modified theme and root files
- Commit: root `/_config.butterfly.yml`, root `/source/ads.txt`, and the updated `themes/butterfly` submodule pointer

**Interfaces:**
- Consumes: the reduced theme surface from Tasks 2-4.
- Produces: a cleanly generated static site and a root commit pointing to the completed theme commit.

- [ ] **Step 1: Check for forbidden remnants**

Run a repository-wide `rg` for every removed identifier while excluding `.git`, `node_modules`, generated `public`, design/plan documents, and `package-lock.json`. Review any hit; only unrelated words such as social-share `wechat` may remain.

- [ ] **Step 2: Check formatting and theme tests**

Run in the theme:

```bash
git diff --check HEAD^
npm test
```

Expected: no whitespace errors and all tests PASS.

- [ ] **Step 3: Generate the site from a clean output directory**

Run at repository root:

```bash
npm run clean
npm run build
```

Expected: Hexo reports successful generation with exit code 0.

- [ ] **Step 4: Confirm generated output has no removed integrations**

Search `public` for removed provider domains, script names, element IDs, and configuration keys. Expected: no matches from theme output.

- [ ] **Step 5: Commit root integration changes**

```bash
git add _config.butterfly.yml source/ads.txt themes/butterfly
git commit -m "refactor: remove unused theme integrations"
```

- [ ] **Step 6: Report verification evidence**

Report the exact test count, Hexo generation result, acceptable lockfile-only transitive packages, and both commit hashes.
