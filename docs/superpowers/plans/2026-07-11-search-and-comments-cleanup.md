# Search and Comments Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Leave Butterfly with Local Search, keyless Google site search, and Giscus while removing all code, configuration, assets, and documentation for the retired search and comment providers.

**Architecture:** Keep the existing `search.use` and `comments.use` entry points. Search dispatch selects either the existing Local Search modal or a new self-contained Google modal; comment rendering dispatches directly to Giscus. Structural Node tests constrain the supported surface, then Hexo generation verifies both search selections with Giscus.

**Tech Stack:** Node.js built-in test runner, Hexo 8, Pug, Stylus, browser JavaScript, YAML configuration.

## Global Constraints

- `search.use` accepts `local_search`, `google_search`, or no value.
- `comments.use` accepts `Giscus` or no value.
- Local Search behavior and the site's current Local Search selection remain unchanged.
- Giscus settings, comment text display, lazy loading, theme synchronization, and PJAX behavior remain unchanged.
- Google search uses `https://www.google.com/search?q=site:<hostname>+<keywords>` in a new isolated tab and adds no SDK, API key, or package dependency.
- Remove comment count and newest-comments features because Giscus cannot supply their data.
- Do not refactor unrelated theme subsystems.

---

### Task 1: Add Google Site Search and Retire the Old Search Surface

**Files:**
- Create: `test/theme-surface.test.js`
- Create: `layout/includes/third-party/search/google-search.pug`
- Modify: `package.json`
- Modify: `_config.yml`
- Modify: `scripts/common/default_config.js`
- Modify: `scripts/events/cdn.js`
- Modify: `layout/includes/head/config.pug`
- Modify: `layout/includes/third-party/search/index.pug`
- Modify: `source/css/_search/index.styl`
- Delete: `layout/includes/third-party/search/algolia.pug`
- Delete: `layout/includes/third-party/search/docsearch.pug`
- Delete: `source/js/search/algolia.js`
- Delete: `source/css/_search/algolia.styl`
- Modify: `plugins.yml`

**Interfaces:**
- Consumes: Hexo `config.url`, `theme.search.use`, `theme.search.placeholder`, `btf.addEventListenerPjax`, and the existing `#search-button`.
- Produces: `google_search` template selection and a Google URL containing one encoded `q` parameter.

- [ ] **Step 1: Write the failing structural search test**

Create `test/theme-surface.test.js` with helpers that read files relative to the theme root, then constrain the provider dispatcher without recording a deny-list:

```js
'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const root = path.join(__dirname, '..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')

const caseValues = source => [...source.matchAll(/when\s+'([^']+)'/g)].map(match => match[1])

test('search exposes only local and Google providers', () => {
  const dispatcher = read('layout/includes/third-party/search/index.pug')
  assert.deepEqual(caseValues(dispatcher), ['local_search', 'google_search'])

  const googleTemplate = read('layout/includes/third-party/search/google-search.pug')
  assert.match(googleTemplate, /URLSearchParams/)
  assert.match(googleTemplate, /site:\$\{site\}/)
  assert.match(googleTemplate, /noopener,noreferrer/)
  assert.match(googleTemplate, /\.trim\(\)/)
})
```

Change the theme `package.json` test script to:

```json
"test": "node --test"
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --test-name-pattern="search exposes"`

Expected: FAIL because the dispatcher still exposes three old/current cases and `google-search.pug` does not exist.

- [ ] **Step 3: Implement the Google modal and reduce search dispatch**

Make `layout/includes/third-party/search/index.pug` dispatch exactly these cases:

```pug
case theme.search.use
  when 'local_search'
    include ./local-search.pug
  when 'google_search'
    include ./google-search.pug
```

Create `google-search.pug` as a search dialog that derives the build-time hostname safely, falls back at runtime, trims input, constructs `site:${site} ${keywords}`, uses `URLSearchParams`, and opens Google with `_blank` plus `noopener,noreferrer`. Register open/close handlers through `btf.addEventListenerPjax`, close on the mask and Escape, and focus the input when opened.

The required submission core is:

```js
const keywords = input.value.trim()
if (!keywords) return
const site = configuredSite || location.hostname
const params = new URLSearchParams({ q: `site:${site} ${keywords}` })
window.open(`https://www.google.com/search?${params}`, '_blank', 'noopener,noreferrer')
```

Update `_config.yml` and `default_config.js` so search contains only `use`, `placeholder`, and `local_search`; document `google_search` as a valid `use` value without introducing provider secrets. Remove the old search runtime payload from `head/config.pug`, the old internal asset mapping from `cdn.js`, provider resources from `plugins.yml`, and provider-only Stylus imports/selectors. Delete the four provider-only implementation files listed above.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- --test-name-pattern="search exposes"`

Expected: PASS with one passing test and no warnings.

- [ ] **Step 5: Commit the search slice**

```bash
git add package.json test/theme-surface.test.js _config.yml scripts/common/default_config.js scripts/events/cdn.js layout/includes/head/config.pug layout/includes/third-party/search source/css/_search source/js/search/algolia.js plugins.yml
git commit -m "feat: add Google site search"
```

---

### Task 2: Reduce Comments to Giscus

**Files:**
- Modify: `test/theme-surface.test.js`
- Modify: `_config.yml`
- Modify: `scripts/common/default_config.js`
- Modify: `scripts/events/init.js`
- Modify: `layout/includes/third-party/comments/index.pug`
- Modify: `layout/includes/third-party/comments/js.pug`
- Modify: `layout/includes/third-party/comments/giscus.pug`
- Modify: `layout/includes/third-party/pjax.pug`
- Modify: `layout/includes/header/post-info.pug`
- Modify: `layout/includes/mixins/indexPostUI.pug`
- Modify: `layout/includes/additional-js.pug`
- Modify: `layout/includes/widget/index.pug`
- Modify: `layout/includes/head/Open_Graph.pug`
- Modify: `source/css/_layout/third-party.styl`
- Modify: `source/css/_mode/darkmode.styl`
- Modify: `source/js/main.js`
- Modify: `plugins.yml`
- Delete: all comment templates except `comments/index.pug`, `comments/js.pug`, and `comments/giscus.pug`
- Delete: `layout/includes/third-party/card-post-count/`
- Delete: `layout/includes/third-party/newest-comments/`
- Delete: `layout/includes/widget/card_newest_comment.pug`

**Interfaces:**
- Consumes: `comments.use: Giscus`, `comments.text`, `comments.lazyload`, `theme.giscus`, page front-matter `comments`, and existing Giscus loader hooks.
- Produces: one `#giscus-wrap` container and one direct Giscus loader path.

- [ ] **Step 1: Add the failing structural comment test**

Append this test without naming retired providers:

```js
test('comments expose only the Giscus implementation', () => {
  const commentsDir = path.join(root, 'layout/includes/third-party/comments')
  assert.deepEqual(fs.readdirSync(commentsDir).sort(), ['giscus.pug', 'index.pug', 'js.pug'])
  assert.equal(fs.existsSync(path.join(root, 'layout/includes/third-party/card-post-count')), false)
  assert.equal(fs.existsSync(path.join(root, 'layout/includes/third-party/newest-comments')), false)

  const container = read('layout/includes/third-party/comments/index.pug')
  assert.match(container, /#giscus-wrap/)
  assert.doesNotMatch(container, /\beach\b|\bcase\b|comment-switch/)

  const loader = read('layout/includes/third-party/comments/js.pug')
  assert.match(loader, /comments\/giscus/)
  assert.doesNotMatch(loader, /\beach\b|\bcase\b/)
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --test-name-pattern="comments expose"`

Expected: FAIL because provider templates and count/newest-comment directories still exist.

- [ ] **Step 3: Remove provider dispatch and dead comment features**

Reduce `comments/index.pug` to the shared heading and one `#giscus-wrap`. Reduce `comments/js.pug` to one cached partial of `comments/giscus`. Simplify `giscus.pug` so it no longer branches between first/second providers while preserving normal posts, lazy loading, shuoshuo loading/destruction, theme messages, and custom options.

Keep comment normalization in `init.js`, but normalize a scalar/array to either `['Giscus']` or `[]`; remove conflict handling. Keep the Giscus-specific canonical/Open Graph refresh condition in `pjax.pug`.

Remove count and provider page-view branches from `header/post-info.pug`; always use the unrelated analytics/busuanzi page-view fallback. Remove homepage comment count markup and `needLoadCountJs` plumbing from `indexPostUI.pug` and `additional-js.pug`. Remove newest-comments widget inclusion, adapter loading, configuration, translations, styles, and all provider resources. Remove Facebook-only Open Graph settings and provider-only dark/layout CSS. Remove the delayed theme-change special case from `source/js/main.js`.

The retained default comment configuration must be:

```js
comments: {
  use: null,
  text: true,
  lazyload: false
}
```

- [ ] **Step 4: Run the comment test and full tests**

Run: `npm test -- --test-name-pattern="comments expose"`

Expected: PASS.

Run: `npm test`

Expected: two passing tests, no failures.

- [ ] **Step 5: Commit the comment slice**

```bash
git add _config.yml scripts/common/default_config.js scripts/events/init.js layout source plugins.yml test/theme-surface.test.js
git commit -m "refactor: keep only Giscus comments"
```

---

### Task 3: Clean Documentation, Translations, and Site Overrides

**Files:**
- Modify: `README.md`
- Modify: `README_CN.md`
- Modify: `languages/default.yml`
- Modify: `languages/en.yml`
- Modify: `languages/ja.yml`
- Modify: `languages/ko.yml`
- Modify: `languages/zh-CN.yml`
- Modify: `languages/zh-HK.yml`
- Modify: `languages/zh-TW.yml`
- Modify outside theme: `/Users/iuxt/code/zahuifan/_config.yml`
- Modify outside theme: `/Users/iuxt/code/zahuifan/_config.butterfly.yml`

**Interfaces:**
- Consumes: the final supported search/comment surface from Tasks 1 and 2.
- Produces: user-facing documentation and active site configuration matching that surface.

- [ ] **Step 1: Add a failing documentation/configuration constraint**

Append a test that verifies the public feature summary names Local Search, Google site search, and Giscus, and that every translation file has no nested search provider object other than `local_search`:

```js
test('documentation describes the reduced provider surface', () => {
  const readme = read('README.md')
  assert.match(readme, /Local Search/)
  assert.match(readme, /Google Site Search/)
  assert.match(readme, /Giscus/)

  for (const file of fs.readdirSync(path.join(root, 'languages'))) {
    const language = read(`languages/${file}`)
    const providerKeys = [...language.matchAll(/^  ([a-z_]+):\s*$/gm)].map(match => match[1])
    assert.equal(providerKeys.includes('local_search'), true)
    assert.equal(providerKeys.filter(key => key.endsWith('_search')).length, 1)
  }
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --test-name-pattern="documentation describes"`

Expected: FAIL because the README files do not yet describe Google Site Search and translations still contain an extra provider block.

- [ ] **Step 3: Update public docs and active site configuration**

Change the README feature bullets to “Local Search / Google Site Search” and “Giscus comments.” Remove retired search translations but keep Local Search messages. Remove obsolete newest-comments translation blocks.

In `/Users/iuxt/code/zahuifan/_config.butterfly.yml`, keep:

```yaml
search:
  use: local_search

comments:
  use: Giscus
  text: true
  lazyload: true
```

Preserve the existing Local Search details and Giscus credentials, while deleting obsolete count options and newest-comments configuration. Remove the commented Algolia indexing example from `/Users/iuxt/code/zahuifan/_config.yml`.

- [ ] **Step 4: Run all structural tests and verify GREEN**

Run: `npm test`

Expected: three passing tests, no failures.

- [ ] **Step 5: Commit theme documentation**

```bash
git add README.md README_CN.md languages test/theme-surface.test.js
git commit -m "docs: describe supported integrations"
```

The two site-root configuration files are outside the nested theme Git repository and remain as workspace changes for the parent project.

---

### Task 4: Build Both Search Modes and Audit Residue

**Files:**
- Verify all files changed in Tasks 1–3
- Temporarily edit and restore: `/Users/iuxt/code/zahuifan/_config.butterfly.yml`

**Interfaces:**
- Consumes: finished theme and site configuration.
- Produces: build evidence for Local Search plus Giscus and Google Search plus Giscus.

- [ ] **Step 1: Verify Local Search and Giscus build**

From `/Users/iuxt/code/zahuifan`, run:

```bash
npx hexo clean
npx hexo generate
```

Expected: exit 0. Generated HTML contains `local-search`, references the Local Search script, contains the Giscus loader on comment-enabled content, and does not contain Google Search markup.

- [ ] **Step 2: Verify Google Search and Giscus build without retaining the temporary selection**

Back up `_config.butterfly.yml`, change only `use: local_search` to `use: google_search`, run `npx hexo clean && npx hexo generate`, inspect generated HTML for `google-search`, the Google endpoint, and Giscus, then restore the exact original file before any other action.

Expected: exit 0; Google markup is present, Local Search script is absent, Giscus remains present, and `git diff -- _config.butterfly.yml` shows only the intentional permanent cleanup from Task 3.

- [ ] **Step 3: Run final tests and residue scan**

Run `npm test` in the theme. Then scan theme code, configuration, READMEs, languages, and plugin metadata plus the two site configuration files for retired-provider identifiers. Exclude `docs/superpowers/` because it is immutable design history.

Expected: tests pass and the scan returns no matches.

- [ ] **Step 4: Review final diff integrity**

Run:

```bash
git diff --check
git status --short
git log --oneline -5
```

Expected: no whitespace errors, only planned theme changes are committed, and only the planned parent-workspace configuration edits remain outside the nested theme repository.
