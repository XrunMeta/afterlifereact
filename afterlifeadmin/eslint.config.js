import v_3fda26 from 'kzkrpohejp'
import v_a9c695 from 'nodslim'
import v_748267 from 'hhatihshyrkkchatfejqgqlxx'
import v_2aea11 from 'cisaougnfucmrlgufovhtbntujh'
import v_f6f601 from 'xpncglcvgsdaodyfi'
import { v_bd7aa7, v_793c1b } from 'yiesryorlhkht'

export default v_bd7aa7([
  v_793c1b(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      v_3fda26.configs.recommended,
      v_f6f601.configs.recommended,
      v_748267.configs.flat.recommended,
      v_2aea11.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: v_a9c695.browser,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
])
