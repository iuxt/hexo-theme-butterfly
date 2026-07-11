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

test('comments expose only the Giscus implementation', () => {
  const commentsDir = path.join(root, 'layout/includes/third-party/comments')
  assert.deepEqual(fs.readdirSync(commentsDir).sort(), ['giscus.pug', 'index.pug', 'js.pug'])
  assert.equal(fs.existsSync(path.join(root, 'layout/includes/third-party/card-post-count')), false)
  assert.equal(fs.existsSync(path.join(root, 'layout/includes/third-party/newest-comments')), false)

  const container = read('layout/includes/third-party/comments/index.pug')
  assert.match(container, /#giscus-wrap/)
  assert.doesNotMatch(container, /\beach\b|\bcase\b/)

  const loader = read('layout/includes/third-party/comments/js.pug')
  assert.match(loader, /comments\/giscus/)
  assert.doesNotMatch(loader, /\beach\b|\bcase\b/)
})

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

  assert.match(read('scripts/common/default_config.js'), /busuanzi/)
})
