import prettier from 'eslint-plugin-prettier';

export default {
  files: ['**/*.js'],
  ignores: ['**/node_modules/**', 'cypress/reports/', '**/*.min.js'],
  languageOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    globals: {
      browser: 'readonly',
      es2021: true,
      node: 'readonly',
      mocha: 'readonly'
    }
  },
  plugins: {
    prettier
  },
  rules: {
    'prettier/prettier': 'error',
    semi: 'off',
    quotes: 'off',
    indent: 'off'
  }
};
