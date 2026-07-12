const { deepMerge } = require('hexo-util')
const path = require('path')

// Cache default config to avoid repeated file reads
let cachedDefaultConfig = null

/**
 * Check Hexo version and configuration
 */
function checkHexoEnvironment (hexo) {
  const { version, log, locals } = hexo

  const [major, minor] = version.split('.').map(Number)
  const requiredMajor = 5
  const requiredMinor = 3

  if (major < requiredMajor || (major === requiredMajor && minor < requiredMinor)) {
    log.error('Please update Hexo to V5.3.0 or higher!')
    log.error('請把 Hexo 升級到 V5.3.0 或更高的版本！')
    throw new Error('Hexo version too old')
  }

  // Check for deprecated configuration file
  if (locals.get) {
    const data = locals.get('data')
    if (data && data.butterfly) {
      log.error("'butterfly.yml' is deprecated. Please use '_config.butterfly.yml'")
      log.error("'butterfly.yml' 已經棄用，請使用 '_config.butterfly.yml'")
      throw new Error('Deprecated configuration file')
    }
  }
}

/**
 * Load default configuration
 */
function loadDefaultConfig () {
  if (cachedDefaultConfig) {
    return cachedDefaultConfig
  }

  const configPath = path.join(__dirname, '../common/default_config.js')
  cachedDefaultConfig = require(configPath)
  return cachedDefaultConfig
}

hexo.extend.filter.register('before_generate', () => {
  checkHexoEnvironment(hexo)

  const defaultConfig = loadDefaultConfig()
  hexo.theme.config = deepMerge(defaultConfig, hexo.theme.config)
}, 1)
