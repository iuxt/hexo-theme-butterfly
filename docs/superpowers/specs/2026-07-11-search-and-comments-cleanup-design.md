# Search and Comments Cleanup Design

## Goal

Reduce the Butterfly theme to two optional search providers and one optional
comment provider:

- Search: Local Search or Google site search
- Comments: Giscus

The cleanup must remove the configuration, templates, browser assets, CDN
metadata, documentation, translations, and shared-code branches that only
serve the removed providers. The site-level configuration outside the theme
must also stop documenting Algolia.

## Compatibility Boundary

The existing top-level configuration shapes remain stable:

- `search.use` selects `local_search`, `google_search`, or no search.
- `comments.use` selects `Giscus` or no comments.
- Existing Local Search settings remain unchanged.
- Existing Giscus settings, comment text display, lazy loading, and PJAX
  behavior remain unchanged.

The theme no longer supports multiple simultaneous comment providers. Comment
count settings and the newest-comments card are removed because the retained
Giscus implementation cannot supply data to those features.

## Search Design

### Local Search

Local Search keeps its current template, browser script, styling, runtime
configuration, and internal asset mapping. The site's current
`search.use: local_search` setting remains active after the cleanup.

### Google Site Search

`search.use: google_search` renders one search button and a theme-native modal.
The modal contains a text input and submit control. On a non-empty submission,
the browser opens Google in a new tab with a query of this form:

```text
site:example.com user keywords
```

The site hostname comes from Hexo's configured `url`. If it cannot be resolved
at generation time, the browser falls back to `location.hostname`. Query
construction uses `URLSearchParams` so user input and non-ASCII keywords are
encoded safely. Empty or whitespace-only input does not navigate.

The Google implementation does not use an API key, Google SDK, remote script,
or a new package dependency. It reuses the theme's search dialog presentation
and its existing mask, close, keyboard, and PJAX interaction patterns.

### Removed Search Providers

Algolia Search and DocSearch are removed from:

- Theme and runtime default configuration
- Search dispatch templates and head configuration
- Provider-specific templates, browser JavaScript, and Stylus files
- Internal and third-party CDN metadata
- Translation keys, README feature lists, and site configuration comments

## Comments Design

The generic comment entry condition remains: a page renders comments when
comments are enabled globally and not disabled by page front matter. The
rendered container and loader are simplified to Giscus only.

The retained behavior includes:

- Giscus repository, category, theme, script, and option settings
- Lazy loading
- Dark/light theme synchronization
- PJAX metadata refresh and teardown behavior
- The comment label controlled by `comments.text`

Provider switching UI is removed because there is only one provider. The
configuration normalizer may still accept the existing string form
`comments.use: Giscus`, but it no longer contains provider conflict handling.

The following provider-specific implementations are removed everywhere:

- Disqus and Disqusjs
- Livere
- Gitalk
- Valine and Waline
- Utterances
- Facebook Comments
- Twikoo
- Remark42
- Artalk

This includes comment containers and loaders, post and index comment counts,
provider-backed page views, newest-comments adapters, Open Graph fields used
only by Facebook Comments, styles, CDN entries, configuration, and docs.

Because Giscus does not support the theme's existing newest-comments and
comment-count adapters, the following dead features are removed as a unit:

- `aside.card_newest_comments`
- `comments.count`
- `comments.card_post_count`
- Their templates, loaders, translations, styles, and dispatch plumbing

Unrelated page-view providers remain intact and become the only page-view
fallback path in post metadata.

## Site Configuration

The site-level `_config.butterfly.yml` continues to select Local Search and
Giscus. Obsolete comment-count options are removed from it. The commented
Algolia indexing example is removed from the site-level `_config.yml`.

## Error Handling and Safety

- Google search ignores empty input.
- Invalid or missing configured URLs fall back to the current browser hostname.
- Google search opens with `noopener,noreferrer` isolation.
- User keywords are passed as encoded query data, never interpolated into HTML.
- Missing or disabled search/comments settings continue to render no entry.
- Removed provider names are not silently mapped to another provider.

## Testing and Verification

Implementation follows a red-green cleanup cycle:

1. Add structural regression tests that initially fail because removed
   provider artifacts exist and Google Search does not.
2. Implement the smallest cleanup and Google Search support that satisfies the
   tests.
3. Run the complete structural test suite.
4. Generate the Hexo site with the current Local Search and Giscus settings.
5. Generate with a temporary Google Search and Giscus configuration without
   permanently changing the user's selected Local Search setting.
6. Inspect generated HTML to confirm the selected search provider is present,
   Giscus remains present, and removed provider resources are absent.
7. Scan executable code, configuration, docs, translations, and asset metadata
   for removed-provider residue.
8. Review the final diff for unrelated changes.

The structural tests use Node's built-in test runner so the cleanup adds no
test dependency. The normal `npm test` command runs them.

## Non-Goals

- Changing Local Search result behavior or indexing
- Changing Giscus repository/category configuration
- Embedding Google Programmable Search Engine results
- Adding a second simultaneous search button
- Refactoring unrelated theme subsystems
