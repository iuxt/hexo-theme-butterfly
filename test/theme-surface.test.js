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
  const readmeCn = read('README_CN.md')
  assert.match(readme, /Local Search/)
  assert.match(readme, /Google Site Search/)
  assert.doesNotMatch(readme, /Giscus/)
  assert.doesNotMatch(readmeCn, /Giscus/)
  assert.doesNotMatch(readme, /Busuanzi/i)
  assert.doesNotMatch(readmeCn, /Busuanzi|不蒜子/i)
  assert.doesNotMatch(readme, /Analytics\s*&\s*Statistics/i)
  assert.doesNotMatch(readmeCn, /數據分析|数据分析/)

  for (const file of fs.readdirSync(path.join(root, 'languages'))) {
    const language = read(`languages/${file}`)
    const providerKeys = [...language.matchAll(/^  ([a-z_]+):\s*$/gm)].map(match => match[1])
    assert.equal(providerKeys.includes('local_search'), true)
    assert.equal(providerKeys.filter(key => key.endsWith('_search')).length, 1)
  }
})

test('removed optional integrations have no theme surface', () => {
  const removedPaths = [
    'scripts/tag/chartjs.js',
    'scripts/tag/score.js',
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
  for (const file of removedPaths) {
    assert.equal(fs.existsSync(path.join(root, file)), false, file)
  }

  const removedKeys = [
    'chartjs',
    'snackbar',
    'abcjs',
    'lightbox',
    'canvas_fluttering_ribbon',
    'canvas_nest',
    'fireworks',
    'click_heart',
    'clickShowText',
    'canvas_ribbon',
    'site_verification',
    'ad',
    'google_adsense',
    'google_tag_manager',
    'baidu_analytics',
    'google_analytics',
    'cloudflare_analytics',
    'microsoft_clarity',
    'umami_analytics',
    'chat',
    'chatra',
    'tidio',
    'crisp'
  ]
  for (const file of ['_config.yml', 'scripts/common/default_config.js']) {
    const config = read(file)
    for (const key of removedKeys) {
      assert.doesNotMatch(config, new RegExp(`^\\s*${key}:`, 'm'), `${file}: ${key}`)
    }
  }

  const runtime = [
    'layout/includes/head.pug',
    'layout/includes/additional-js.pug',
    'layout/includes/head/config.pug',
    'layout/includes/rightside.pug',
    'source/js/main.js',
    'source/js/utils.js',
    'source/js/tw_cn.js',
    'source/css/_layout/third-party.styl',
    'plugins.yml'
  ].map(read).join('\n')
  const removedRuntimePatterns = [
    /chartjs/i,
    /snackbar/i,
    /abcjs/i,
    /lightbox/i,
    /canvas_fluttering_ribbon/,
    /canvas_nest/,
    /fireworks/,
    /click_heart/,
    /clickShowText/,
    /canvas_ribbon/,
    /site_verification/,
    /google_adsense/,
    /google_tag_manager/,
    /baidu_analytics/,
    /google_analytics/,
    /cloudflare_analytics/,
    /microsoft_clarity/,
    /umami_analytics/,
    /theme\.ad\b/,
    /theme\.chat\b/,
    /chat-btn/
  ]
  for (const pattern of removedRuntimePatterns) assert.doesNotMatch(runtime, pattern)
})

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
