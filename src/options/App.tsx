import { useState } from 'react'
import { Button } from '@/components/Button'
import { useSettings } from '@/hooks/useSettings'
import { isTargetLang } from '@/shared/messages'
import { DEFAULT_SETTINGS, TARGET_LANG_OPTIONS, type Settings } from '@/shared/settings'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const STATUS_TEXT: Record<Exclude<SaveStatus, 'idle'>, string> = {
  saving: '保存中…',
  saved: '已保存',
  error: '保存失败，请重试',
}

export function App() {
  const { settings, isLoading, updateSettings } = useSettings()
  const [status, setStatus] = useState<SaveStatus>('idle')

  const save = async (patch: Partial<Settings>) => {
    setStatus('saving')
    try {
      await updateSettings(patch)
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }

  return (
    <main className="options">
      <header>
        <h1 className="options__title">AI Translator 设置</h1>
        <p className="muted">设置通过 chrome.storage.sync 同步到同一账号的其他浏览器。</p>
      </header>

      <section className="card">
        <div className="field">
          <label className="field__label" htmlFor="target-lang">
            目标语言
          </label>
          <select
            id="target-lang"
            className="field__select"
            value={settings.targetLang}
            disabled={isLoading}
            onChange={(event) => {
              const value = event.target.value
              if (isTargetLang(value)) {
                void save({ targetLang: value })
              }
            }}
          >
            {TARGET_LANG_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="field__checkbox" htmlFor="auto-translate">
            <input
              id="auto-translate"
              type="checkbox"
              checked={settings.autoTranslate}
              disabled={isLoading}
              onChange={(event) => void save({ autoTranslate: event.target.checked })}
            />
            <span>划词后自动翻译</span>
          </label>
          <p className="field__hint">关闭时，划词后需要在气泡中点击「翻译」。</p>
        </div>

        <div className="options__footer">
          <Button variant="ghost" onClick={() => void save(DEFAULT_SETTINGS)}>
            恢复默认设置
          </Button>
          <p className="status" role="status" aria-live="polite">
            {status === 'idle' ? '' : STATUS_TEXT[status]}
          </p>
        </div>
      </section>

      <section className="card">
        <h2 className="card__title">关于</h2>
        <p className="muted">
          版本 {chrome.runtime.getManifest().version}。这是一个项目骨架，翻译逻辑位于{' '}
          <code>src/background/mock-translator.ts</code>。
        </p>
      </section>
    </main>
  )
}
