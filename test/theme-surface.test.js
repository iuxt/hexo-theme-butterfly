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
