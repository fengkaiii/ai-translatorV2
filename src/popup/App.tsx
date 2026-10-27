import { useState } from 'react'
import { Button } from '@/components/Button'
import { useSettings } from '@/hooks/useSettings'
import { sendMessage, type TranslationResult } from '@/shared/messages'
import { getTargetLangLabel } from '@/shared/settings'

export function App() {
  const { settings, isLoading } = useSettings()
  const [text, setText] = useState('')
  const [result, setResult] = useState<TranslationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)

  const handleTranslate = async () => {
    const trimmed = text.trim()
    if (trimmed.length === 0 || isTranslating) {
      return
    }

    setIsTranslating(true)
    setError(null)

    const response = await sendMessage({
      type: 'translate',
      payload: { text: trimmed, targetLang: settings.targetLang },
    })

    setIsTranslating(false)
    if (response.ok) {
      setResult(response.data)
    } else {
      setError(response.error)
    }
  }

  return (
    <main className="popup">
      <header className="popup__header">
        <h1 className="popup__title">AI Translator</h1>
        <span className="popup__badge">{getTargetLangLabel(settings.targetLang)}</span>
      </header>

      <p className="muted">在任意网页选中文字即可划词翻译，这里可以快速试译。</p>

      <div className="field">
        <label className="field__label" htmlFor="popup-text">
          原文
        </label>
        <textarea
          id="popup-text"
          className="field__textarea"
          rows={4}
          value={text}
          placeholder="输入或粘贴要翻译的文本…"
          onChange={(event) => setText(event.target.value)}
        />
      </div>

      <div className="popup__actions">
        <Button
          onClick={() => void handleTranslate()}
          disabled={isTranslating || isLoading || text.trim().length === 0}
        >
          {isTranslating ? '翻译中…' : '翻译'}
        </Button>
        <Button variant="ghost" onClick={() => void chrome.runtime.openOptionsPage()}>
          设置
        </Button>
      </div>

      {error && (
        <p className="status status--error" role="alert">
          {error}
        </p>
      )}

      {result && (
        <section className="popup__result" aria-live="polite">
          <h2 className="field__label">译文</h2>
          <p>{result.translatedText}</p>
        </section>
      )}
    </main>
  )
}
