'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')

const utilsPath = path.join(__dirname, '..', 'source/js/utils.js')
const utilsSource = fs.readFileSync(utilsPath, 'utf8')

const createImage = ({ src = 'image.jpg', lazySrc, title = '', alt = '', linked = false, noLightbox = false } = {}) => {
  const parent = {
    inserted: [],
    insertBefore: (element, reference) => {
      assert.equal(reference, image)
      element.parentNode = parent
      parent.inserted.push(element)
    }
  }
  const image = {
    src,
    dataset: lazySrc ? { lazySrc } : {},
    title,
    alt,
    parentNode: parent,
    closest: selector => {
      assert.equal(selector, 'a')
      return linked ? { tagName: 'A' } : null
    },
    classList: {
      contains: className => className === 'no-lightbox' && noLightbox
    }
  }

  return { image, parent }
}

const createHarness = () => {
  const bindCalls = []
  const sandbox = {
    GLOBAL_CONFIG: { lightbox: 'fancybox' },
    document: {
      createElement: tagName => ({
        tagName: tagName.toUpperCase(),
        attributes: {},
        setAttribute (name, value) {
          this.attributes[name] = value
        },
        appendChild (child) {
          this.child = child
          child.parentNode = this
        }
      })
    },
    Fancybox: {
      bind: (selector, options) => bindCalls.push({ selector, options })
    }
  }
  sandbox.window = sandbox

  vm.runInNewContext(utilsSource, sandbox, { filename: utilsPath })

  return { bindCalls, loadLightbox: sandbox.btf.loadLightbox }
}

test('loadLightbox wraps eligible images with lazy URLs and title/alt captions', () => {
  const { bindCalls, loadLightbox } = createHarness()
  const lazy = createImage({
    src: 'placeholder.jpg',
    lazySrc: 'lazy.jpg',
    title: 'Title caption',
    alt: 'Ignored alt'
  })
  const altOnly = createImage({ src: 'alt.jpg', alt: 'Alt caption' })

  loadLightbox([lazy.image, altOnly.image])

  assert.deepEqual(lazy.image.parentNode.attributes, {
    href: 'lazy.jpg',
    'data-fancybox': 'gallery',
    'data-caption': 'Title caption',
    'data-thumb': 'lazy.jpg'
  })
  assert.equal(lazy.image.parentNode.child, lazy.image)
  assert.equal(altOnly.image.parentNode.attributes['data-caption'], 'Alt caption')
  assert.equal(bindCalls.length, 1)
  assert.equal(bindCalls[0].selector, '[data-fancybox="gallery"]')
  assert.equal(bindCalls[0].options.Hash, false)
})

test('loadLightbox leaves linked and no-lightbox images unchanged', () => {
  const { loadLightbox } = createHarness()
  const linked = createImage({ linked: true })
  const noLightbox = createImage({ noLightbox: true })

  loadLightbox([linked.image, noLightbox.image])

  assert.equal(linked.parent.inserted.length, 0)
  assert.equal(noLightbox.parent.inserted.length, 0)
  assert.equal(linked.image.parentNode, linked.parent)
  assert.equal(noLightbox.image.parentNode, noLightbox.parent)
})

test('loadLightbox wraps new images on later calls and binds Fancybox once', () => {
  const { bindCalls, loadLightbox } = createHarness()
  const first = createImage({ src: 'first.jpg' })
  const second = createImage({ src: 'second.jpg' })

  loadLightbox([first.image])
  loadLightbox([second.image])

  assert.equal(first.image.parentNode.attributes.href, 'first.jpg')
  assert.equal(second.image.parentNode.attributes.href, 'second.jpg')
  assert.equal(bindCalls.length, 1)
})
