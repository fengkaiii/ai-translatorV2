import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json' with { type: 'json' }

const icons = {
  16: 'icons/icon16.png',
  32: 'icons/icon32.png',
  48: 'icons/icon48.png',
  128: 'icons/icon128.png',
} as const

export default defineManifest({
  manifest_version: 3,
  name: 'AI Translator',
  version: pkg.version,
  description: '划词即译的 AI 翻译扩展（项目骨架）',
  minimum_chrome_version: '114',
  icons,
  action: {
    default_title: 'AI Translator',
    default_popup: 'src/popup/index.html',
    default_icon: {
      16: icons[16],
      32: icons[32],
    },
  },
  options_ui: {
    page: 'src/options/index.html',
    open_in_tab: true,
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.tsx'],
      run_at: 'document_idle',
    },
  ],
  // 最小权限：仅使用 storage；新增权限前先确认是否真的需要
  permissions: ['storage'],
})
