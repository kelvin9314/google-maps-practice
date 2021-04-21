module.exports = {
  env: {
    browser: true,
    es6: true,
    'jest/globals': true,
  },
  extends: ['plugin:react/recommended', 'standard', 'plugin:prettier/recommended', 'plugin:jest/recommended'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 11,
    sourceType: 'module',
  },
  settings: {
    react: {
      version: 'detect', // React version. "detect" automatically picks the version you have installed.
    },
  },
  plugins: ['react', 'react-hooks'],
  rules: {
    'no-unused-vars': 'off',
    'react/prop-types': 0,
    'react-hooks/rules-of-hooks': 'warn', // 檢查 Hook 的規則
    'react-hooks/exhaustive-deps': 'warn', // 檢查 effect 的相依性
    'jsx-a11y/anchor-is-valid': 'off',
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off',
  },
}
