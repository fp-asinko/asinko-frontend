import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import boundaries from 'eslint-plugin-boundaries'
import prettier from 'eslint-config-prettier/flat'

// Architectural layers from docs/ai-guidelines/structure.md and tooling.md.
// Patterns start with `**/` so the lint test fixtures (src/test/fixtures/boundaries/src/...)
// are classified exactly like real code. Root files (src/env.ts, src/proxy.ts,
// src/instrumentation*.ts) belong to no layer: they are the entry points and config.
const ELEMENTS = [
  { type: 'app', pattern: '**/src/app' },
  { type: 'feature', pattern: '**/src/features/*', capture: ['root', 'featureName'] },
  { type: 'ui', pattern: '**/src/components/ui' },
  { type: 'molecules', pattern: '**/src/components/molecules' },
  { type: 'organisms', pattern: '**/src/components/organisms' },
  { type: 'hooks', pattern: '**/src/hooks' },
  { type: 'lib', pattern: '**/src/lib' },
  { type: 'i18n', pattern: '**/src/i18n' },
  { type: 'mocks', pattern: '**/src/mocks' },
]

const ALL_TYPES = ELEMENTS.map((element) => element.type)
const allowTo = (...types) => ({ to: { element: { types: { anyOf: types } } } })

const BOUNDARY_POLICIES = [
  // Third-party packages and Node built-ins are always allowed.
  { allow: { to: { module: { origin: ['external', 'core'] } } } },
  { from: { element: { type: 'app' } }, allow: allowTo(...ALL_TYPES) },
  {
    from: { element: { type: 'feature' } },
    allow: allowTo('ui', 'molecules', 'organisms', 'hooks', 'lib', 'i18n'),
  },
  // A feature may import its own files, never another feature.
  {
    from: { element: { type: 'feature' } },
    allow: {
      to: {
        element: {
          type: 'feature',
          captured: { featureName: '{{ from.element.captured.featureName }}' },
        },
      },
    },
  },
  // Organisms may compose other organisms (e.g. app-shell uses site-header).
  {
    from: { element: { type: 'organisms' } },
    allow: allowTo('organisms', 'molecules', 'ui', 'hooks', 'lib', 'i18n'),
  },
  {
    from: { element: { type: 'molecules' } },
    allow: allowTo('molecules', 'ui', 'hooks', 'lib', 'i18n'),
  },
  { from: { element: { type: 'ui' } }, allow: allowTo('ui', 'lib') },
  { from: { element: { type: 'hooks' } }, allow: allowTo('hooks', 'lib') },
  { from: { element: { type: 'lib' } }, allow: allowTo('lib', 'mocks') },
  { from: { element: { type: 'mocks' } }, allow: allowTo('mocks', 'lib') },
  { from: { element: { type: 'i18n' } }, allow: allowTo('i18n', 'lib') },
]

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  // Full jsx-a11y recommended set. The plugin is already registered by eslint-config-next.
  { rules: jsxA11y.flatConfigs.recommended.rules },

  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: { 'boundaries/elements': ELEMENTS },
    rules: {
      'boundaries/dependencies': ['error', { default: 'disallow', policies: BOUNDARY_POLICIES }],
    },
  },

  {
    rules: {
      'react/no-danger': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { ignoreRestSiblings: true, argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'next/link',
              message: 'Use Link from @/i18n/navigation (keeps the locale).',
            },
            {
              name: 'next/navigation',
              importNames: ['redirect', 'permanentRedirect', 'useRouter', 'usePathname'],
              message: 'Use the localized version from @/i18n/navigation.',
            },
          ],
          patterns: [
            {
              group: ['@radix-ui/*'],
              message: 'The project uses Base UI, never Radix (libraries.md).',
            },
          ],
        },
      ],
    },
  },

  // src/i18n/ is the only place allowed to wrap Next.js navigation.
  {
    files: ['src/i18n/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['@radix-ui/*'], message: 'Use Base UI, never Radix.' }] },
      ],
    },
  },

  // Tests may import across layers (helpers, fixtures, the unit under test).
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**', 'e2e/**'],
    ignores: ['src/test/fixtures/**'],
    rules: { 'boundaries/dependencies': 'off' },
  },

  prettier,

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    'next-env.d.ts',
    '.claude/**',
    'docs/**',
    // Intentional violations, linted only by src/test/eslint-rules.test.ts.
    'src/test/fixtures/**',
  ]),
])
