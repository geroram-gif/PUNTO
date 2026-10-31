// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    // design/ es la referencia original del handoff: no se toca ni se lintea.
    ignores: ['design/*', 'dist/*', '.expo/*', 'coverage/*'],
  },
]);
