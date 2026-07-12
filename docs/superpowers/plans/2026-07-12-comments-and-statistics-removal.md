# Comments and Statistics Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all comment, word-count, visit-count, and analytics surfaces from the customized Butterfly theme and the consuming Hexo site.

**Architecture:** Enforce the reduced feature surface with source-level contract tests, then remove callers before deleting dedicated implementations. Keep the theme's article, page, shuoshuo, right-side, and web-info structures intact while eliminating only comment/statistics branches; finish by cleaning the site override and validating generated HTML.

**Tech Stack:** Hexo 8.1.1, Pug, Stylus, Node.js built-in test runner, YAML

## Global Constraints

- Do not modify files under the root site's `source/` directory.
- Do not remove unrelated disabled Butterfly features.
- Preserve code-highlighting uses of the word `comment` and unrelated share-provider names.
- Add no dependencies.
- Preserve all pre-existing user changes outside the exact files listed in this plan.

---

### Task 1: Remove the Comment Surface

**Files:**
- Modify: `test/theme-surface.test.js`
- Modify: `README.md`
- Modify: `README_CN.md`
- Modify: `_config.yml`
- Modify: `scripts/common/default_config.js`
- Modify: `scripts/events/init.js`
- Modify: `scripts/events/404.js`
- Modify: `layout/post.pug`
- Modify: `layout/page.pug`
- Modify: `layout/includes/page/shuoshuo.pug`
- Modify: `layout/includes/rightside.pug`
- Modify: `layout/includes/additional-js.pug`
- Modify: `layout/includes/third-party/pjax.pug`
- Modify: `source/js/utils.js`
- Modify: `source/css/var.styl`
- Modify: `source/css/_mode/darkmode.styl`
- Modify: `source/css/_layout/aside.styl`
- Modify: `source/css/_page/shuoshuo.styl`
- Modify: `languages/default.yml`
- Modify: `languages/en.yml`
- Modify: `languages/ja.yml`
- Modify: `languages/ko.yml`
- Modify: `languages/zh-CN.yml`
- Modify: `languages/zh-HK.yml`
- Modify: `languages/zh-TW.yml`
- Delete: `layout/includes/third-party/comments/giscus.pug`
- Delete: `layout/includes/third-party/comments/index.pug`
- Delete: `layout/includes/third-party/comments/js.pug`
- Delete: `source/css/_layout/comments.styl`

**Interfaces:**
- Consumes: Existing Pug page rendering, shuoshuo rendering, PJAX lifecycle, right-side item ordering, and `btf` browser utilities.
- Produces: A theme that renders posts, pages, and shuoshuo without comment state, comment markup, comment scripts, or comment configuration.

- [ ] **Step 1: Replace the Giscus-only test with a failing no-comments contract**

Replace `test('comments expose only the Giscus implementation', ...)` and update the documentation test so the relevant assertions are exactly:

```js
test('comments have no theme surface', () => {
  const removedPaths = [
    'layout/includes/third-party/comments',
    'source/css/_layout/comments.styl'
  ]
  for (const file of removedPaths) {
    assert.equal(fs.existsSync(path.join(root, file)), false, file)
  }

  for (const file of ['_config.yml', 'scripts/common/default_config.js']) {
    const source = read(file)
    assert.doesNotMatch(source, /^\s*comments:/m, `${file}: comments`)
    assert.doesNotMatch(source, /^\s*giscus:/m, `${file}: giscus`)
  }

  const runtimeFiles = [
    'layout/post.pug',
    'layout/page.pug',
    'layout/includes/page/shuoshuo.pug',
    'layout/includes/rightside.pug',
    'layout/includes/additional-js.pug',
    'layout/includes/third-party/pjax.pug',
    'scripts/events/init.js',
    'scripts/events/404.js',
    'source/js/utils.js',
    'source/css/var.styl',
    'source/css/_mode/darkmode.styl',
    'source/css/_layout/aside.styl',
    'source/css/_page/shuoshuo.styl'
  ]
  const runtime = runtimeFiles.map(read).join('\n')
  for (const pattern of [
    /theme\.comments/,
    /commentsJsLoad/,
    /post-comment/,
    /to_comment/,
    /loadComment/,
    /shuoshuo-comment/,
    /giscus/i
  ]) assert.doesNotMatch(runtime, pattern)

  for (const file of fs.readdirSync(path.join(root, 'languages'))) {
    const language = read(`languages/${file}`)
    assert.doesNotMatch(language, /^comment:/m, file)
    assert.doesNotMatch(language, /^\s+scroll_to_comment:/m, file)
  }
})

test('documentation describes search without comments', () => {
  const readme = read('README.md')
  assert.match(readme, /Local Search/)
  assert.match(readme, /Google Site Search/)
  assert.doesNotMatch(readme, /Giscus/)
  assert.doesNotMatch(read('README_CN.md'), /Giscus/)

  for (const file of fs.readdirSync(path.join(root, 'languages'))) {
    const language = read(`languages/${file}`)
    const providerKeys = [...language.matchAll(/^  ([a-z_]+):\s*$/gm)].map(match => match[1])
    assert.equal(providerKeys.includes('local_search'), true)
    assert.equal(providerKeys.filter(key => key.endsWith('_search')).length, 1)
  }
})
```

- [ ] **Step 2: Run the contract and verify it fails for the current comment implementation**

Run:

```bash
node --test test/theme-surface.test.js
```

Expected: FAIL in `comments have no theme surface` because `layout/includes/third-party/comments` still exists; the documentation test also reports the current Giscus text.

- [ ] **Step 3: Remove comment callers and dedicated implementations**

Make these exact behavioral changes:

- In `layout/post.pug`, remove the final `page.comments` conditional and comment partial.
- In `layout/page.pug`, remove `commentsJsLoad`, the `commentLoad` mixin, and every `+commentLoad` call; leave each page-type include unchanged.
- In `layout/includes/page/shuoshuo.pug`, remove the comment bootstrap script, `commentButton`, `commentContainer`, their interpolations, and all `commentsJsLoad` expressions; render tags with `flex-start` when present and no footer action when absent.
- In `layout/includes/rightside.pug`, remove the `when 'comment'` case and change the default show array to `['toc']`.
- In `layout/includes/additional-js.pug`, remove conditional comment script inclusion.
- In `layout/includes/third-party/pjax.pug`, remove comment-provider selection and all comment-provider PJAX cleanup/reload statements while retaining unrelated PJAX callbacks.
- In `scripts/events/init.js`, delete `processCommentConfig` and its invocation.
- In `scripts/events/404.js`, delete the inert `comments: false` property.
- In `source/js/utils.js`, delete `loadComment` after confirming the task removes its final caller.
- Delete the three files under `layout/includes/third-party/comments/` and delete the now-empty directory.
- Delete `source/css/_layout/comments.styl`; remove comment-only variables and selectors from `var.styl`, `darkmode.styl`, `aside.styl`, and `shuoshuo.styl`.
- Remove `comments`, `giscus`, and right-side `comment` examples from `_config.yml` and `scripts/common/default_config.js`.
- Remove Giscus/comment support claims from both README files.
- In every language YAML, delete the root `comment` key and `rightside.scroll_to_comment`; do not touch syntax-highlighting files.

- [ ] **Step 4: Run focused scans and the theme test**

Run:

```bash
rg -n -i 'theme\.comments|commentsJsLoad|post-comment|to_comment|loadComment|shuoshuo-comment|giscus' \
  layout scripts source/js source/css _config.yml languages README.md README_CN.md
node --test test/theme-surface.test.js
```

Expected: `rg` returns no matches; all Node tests PASS.

- [ ] **Step 5: Commit the comment removal**

```bash
git add README.md README_CN.md _config.yml scripts layout source languages test/theme-surface.test.js
git commit -m "refactor: remove comment functionality"
```

### Task 2: Remove Word and Visit Statistics from the Theme

**Files:**
- Modify: `test/theme-surface.test.js`
- Modify: `_config.yml`
- Modify: `scripts/common/default_config.js`
- Modify: `layout/includes/header/post-info.pug`
- Modify: `layout/includes/widget/card_webinfo.pug`
- Modify: `layout/includes/additional-js.pug`
- Modify: `layout/includes/head/preconnect.pug`
- Modify: `plugins.yml`
- Modify: `languages/default.yml`
- Modify: `languages/en.yml`
- Modify: `languages/ja.yml`
- Modify: `languages/ko.yml`
- Modify: `languages/zh-CN.yml`
- Modify: `languages/zh-HK.yml`
- Modify: `languages/zh-TW.yml`

**Interfaces:**
- Consumes: Existing article metadata, web-info card, asset configuration, CDN resolution, and translation lookup.
- Produces: Article and site-info templates with no word-count, reading-time, page-view, visitor, or Busuanzi output.

- [ ] **Step 1: Add a failing no-statistics theme contract**

Append this test to `test/theme-surface.test.js` and remove the obsolete `assert.match(..., /busuanzi/)` assertion from `removed optional integrations have no theme surface`:

```js
test('word and visit statistics have no theme surface', () => {
  for (const file of ['_config.yml', 'scripts/common/default_config.js']) {
    const source = read(file)
    assert.doesNotMatch(source, /^\s*wordcount:/m, `${file}: wordcount`)
    assert.doesNotMatch(source, /^\s*busuanzi:/m, `${file}: busuanzi`)
  }

  const runtimeFiles = [
    'layout/includes/header/post-info.pug',
    'layout/includes/widget/card_webinfo.pug',
    'layout/includes/additional-js.pug',
    'layout/includes/head/preconnect.pug',
    'plugins.yml'
  ]
  const runtime = runtimeFiles.map(read).join('\n')
  for (const pattern of [
    /wordcount/i,
    /min2read/i,
    /busuanzi/i,
    /page_pv/,
    /site_uv/,
    /site_pv/
  ]) assert.doesNotMatch(runtime, pattern)

  for (const file of fs.readdirSync(path.join(root, 'languages'))) {
    const language = read(`languages/${file}`)
    for (const key of [
      'wordcount',
      'min2read',
      'min2read_unit',
      'page_pv',
      'site_wordcount',
      'site_uv_name',
      'site_pv_name'
    ]) assert.doesNotMatch(language, new RegExp(`^\\s+${key}:`, 'm'), `${file}: ${key}`)
  }
})
```

- [ ] **Step 2: Run the contract and verify it fails for current statistics code**

Run:

```bash
node --test test/theme-surface.test.js
```

Expected: FAIL in `word and visit statistics have no theme surface` because both default config sections and runtime references still exist.

- [ ] **Step 3: Remove all word-count and Busuanzi branches**

Apply these exact changes:

- Delete `wordcount` and `busuanzi` sections from `_config.yml` and `scripts/common/default_config.js`.
- In `layout/includes/header/post-info.pug`, delete the `postWordcount` block and the Busuanzi page-view output; retain date/category/tag metadata and separators needed by those surviving items.
- In `layout/includes/widget/card_webinfo.pug`, delete total-word-count, site-UV, and site-PV items; retain runtime and the enclosing card structure.
- In `layout/includes/additional-js.pug`, remove Busuanzi script loading.
- In `layout/includes/head/preconnect.pug`, remove the Busuanzi fallback preconnect.
- In `plugins.yml`, remove the Busuanzi asset entry.
- In each language YAML, remove `post.wordcount`, `post.min2read`, `post.min2read_unit`, `post.page_pv`, `aside.card_webinfo.site_wordcount`, `aside.card_webinfo.site_uv_name`, and `aside.card_webinfo.site_pv_name`.

- [ ] **Step 4: Run focused scans and all theme tests**

Run:

```bash
rg -n -i 'wordcount|min2read|busuanzi|page_pv|site_uv|site_pv|site_wordcount' \
  layout scripts source plugins.yml _config.yml languages
node --test test/theme-surface.test.js
```

Expected: `rg` returns no matches; all Node tests PASS.

- [ ] **Step 5: Commit the statistics removal**

```bash
git add _config.yml scripts/common/default_config.js layout plugins.yml languages test/theme-surface.test.js
git commit -m "refactor: remove theme statistics"
```

### Task 3: Clean the Site Override and Verify Generated Output

**Files:**
- Modify: `../../_config.butterfly.yml`
- Update gitlink: `../butterfly` in the parent repository
- Generated, not committed: `../../public/`

**Interfaces:**
- Consumes: The reduced Butterfly theme from Tasks 1 and 2 and the Hexo site's existing content/configuration.
- Produces: A successful Hexo build whose HTML contains no comment, statistics, or analytics runtime markers.

- [ ] **Step 1: Record the current failing site-config scan**

From the site root, run:

```bash
rg -n -i 'card_newest_comments|wordcount|busuanzi|^comments:|^giscus:|analytics|comment' _config.butterfly.yml
```

Expected: matches include right-side comment examples, `wordcount`, `busuanzi`, `comments`, `giscus`, and the Busuanzi CDN override. The previously removed newest-comments card and analytics keys remain absent.

- [ ] **Step 2: Remove the obsolete site overrides**

In `../../_config.butterfly.yml`, delete:

- `comment` from right-side option comments/default examples;
- the complete `wordcount`, `busuanzi`, `comments`, and `giscus` sections;
- `CDN.option.busuanzi`; if `CDN.option` becomes empty, keep it as `option:` to match the theme schema.

Confirm that `aside.card_newest_comments`, `google_analytics`, and all other analytics keys remain absent; they were already removed by the repository updates that preceded this plan.

Do not edit any file under `../../source/`.

- [ ] **Step 3: Verify source/config absence before building**

From the site root, run:

```bash
rg -n -i 'card_newest_comments|wordcount|busuanzi|^comments:|^giscus:|analytics|comment' _config.butterfly.yml
git diff --check -- _config.butterfly.yml themes/butterfly
```

Expected: `rg` returns no matches and `git diff --check` returns no errors.

- [ ] **Step 4: Build the complete Hexo site**

From the site root, run:

```bash
npm run clean
npm run build
```

Expected: both commands exit 0 and Hexo reports generated files without Pug, Stylus, or configuration errors.

- [ ] **Step 5: Scan generated HTML for removed runtime markers**

From the site root, run:

```bash
if rg -n -i 'giscus\.app|busuanzi|googletagmanager|id=["'"']post-comment|id=["'"']to_comment|post-meta-wordcount|busuanzi_value_' public -g '*.html'; then
  exit 1
fi
```

Expected: no matches and exit 0.

- [ ] **Step 6: Run final repository checks and commit the integration**

Run:

```bash
node --test themes/butterfly/test/theme-surface.test.js
git -C themes/butterfly status --short
git status --short -- _config.butterfly.yml themes/butterfly
git add _config.butterfly.yml themes/butterfly
git commit -m "refactor: remove comments and statistics"
```

Expected: theme tests PASS; the submodule is clean; only `_config.butterfly.yml` and the Butterfly gitlink are staged for the parent commit; the commit succeeds without including article changes.
