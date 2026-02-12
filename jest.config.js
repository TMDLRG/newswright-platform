/** @type {import('jest').Config} */
const config = {
  // ESM packages that need transformation
  transformIgnorePatterns: [
    'node_modules/(?!(unified|remark-parse|remark-stringify|remark-gfm|mdast-util-from-markdown|mdast-util-to-markdown|mdast-util-gfm|mdast-util-gfm-table|mdast-util-gfm-strikethrough|mdast-util-gfm-task-list-item|mdast-util-gfm-autolink-literal|mdast-util-gfm-footnote|mdast-util-to-string|mdast-util-phrasing|mdast-util-find-and-replace|micromark|micromark-core-commonmark|micromark-factory-destination|micromark-factory-label|micromark-factory-space|micromark-factory-title|micromark-factory-whitespace|micromark-util-character|micromark-util-chunked|micromark-util-classify-character|micromark-util-combine-extensions|micromark-util-decode-numeric-character-reference|micromark-util-decode-string|micromark-util-encode|micromark-util-html-tag-name|micromark-util-normalize-identifier|micromark-util-resolve-all|micromark-util-sanitize-uri|micromark-util-subtokenize|micromark-util-symbol|micromark-util-types|micromark-extension-gfm|micromark-extension-gfm-autolink-literal|micromark-extension-gfm-footnote|micromark-extension-gfm-strikethrough|micromark-extension-gfm-table|micromark-extension-gfm-tagfilter|micromark-extension-gfm-task-list-item|ccount|escape-string-regexp|markdown-table|zwitch|longest-streak|unist-util-is|unist-util-visit|unist-util-visit-parents|unist-util-stringify-position|unist-util-remove-position|unist-util-position|vfile|trough|bail|is-plain-obj|devlop)/)',
  ],
  projects: [
    {
      displayName: 'lib',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/lib/**/*.test.ts'],
      transform: {
        '^.+\\.[jt]sx?$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          useESM: false,
        }],
      },
      transformIgnorePatterns: [
        'node_modules/(?!(unified|remark-parse|remark-stringify|remark-gfm|mdast-util-from-markdown|mdast-util-to-markdown|mdast-util-gfm|mdast-util-gfm-table|mdast-util-gfm-strikethrough|mdast-util-gfm-task-list-item|mdast-util-gfm-autolink-literal|mdast-util-gfm-footnote|mdast-util-to-string|mdast-util-phrasing|mdast-util-find-and-replace|micromark|micromark-core-commonmark|micromark-factory-destination|micromark-factory-label|micromark-factory-space|micromark-factory-title|micromark-factory-whitespace|micromark-util-character|micromark-util-chunked|micromark-util-classify-character|micromark-util-combine-extensions|micromark-util-decode-numeric-character-reference|micromark-util-decode-string|micromark-util-encode|micromark-util-html-tag-name|micromark-util-normalize-identifier|micromark-util-resolve-all|micromark-util-sanitize-uri|micromark-util-subtokenize|micromark-util-symbol|micromark-util-types|micromark-extension-gfm|micromark-extension-gfm-autolink-literal|micromark-extension-gfm-footnote|micromark-extension-gfm-strikethrough|micromark-extension-gfm-table|micromark-extension-gfm-tagfilter|micromark-extension-gfm-task-list-item|ccount|escape-string-regexp|markdown-table|zwitch|longest-streak|unist-util-is|unist-util-visit|unist-util-visit-parents|unist-util-stringify-position|unist-util-remove-position|unist-util-position|vfile|trough|bail|is-plain-obj|devlop)/)',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
    {
      displayName: 'ui',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/app/**/*.test.tsx', '<rootDir>/src/components/**/*.test.tsx'],
      transform: {
        '^.+\\.[jt]sx?$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          useESM: false,
        }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
  ],
};

module.exports = config;
