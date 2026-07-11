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
