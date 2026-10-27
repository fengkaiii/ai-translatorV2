import { isRecord } from './guards'
import { isTargetLang, type TargetLang } from './messages'

export interface Settings {
  targetLang: TargetLang
  autoTranslate: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  targetLang: 'zh-CN',
  autoTranslate: false,
}

export const TARGET_LANG_OPTIONS: ReadonlyArray<{ value: TargetLang; label: string }> = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
]

export function getTargetLangLabel(lang: TargetLang): string {
  return TARGET_LANG_OPTIONS.find((option) => option.value === lang)?.label ?? lang
}

function normalizeSettings(raw: unknown): Settings {
  if (!isRecord(raw)) {
    return DEFAULT_SETTINGS
  }
  return {
    targetLang: isTargetLang(raw.targetLang) ? raw.targetLang : DEFAULT_SETTINGS.targetLang,
    autoTranslate:
      typeof raw.autoTranslate === 'boolean' ? raw.autoTranslate : DEFAULT_SETTINGS.autoTranslate,
  }
}

export async function getSettings(): Promise<Settings> {
  try {
    // chrome.storage 的默认值参数要求带索引签名，这里显式展开一次
    const defaults: Record<string, unknown> = { ...DEFAULT_SETTINGS }
    const stored: unknown = await chrome.storage.sync.get(defaults)
    return normalizeSettings(stored)
  } catch {
    // 扩展上下文失效（例如重新加载后）时回退默认值，避免页面侧报错
    return DEFAULT_SETTINGS
  }
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  await chrome.storage.sync.set(patch)
}
