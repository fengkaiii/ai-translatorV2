import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { sendMessage, type TranslationResult } from '@/shared/messages'

interface SelectionBubbleProps {
  /** 宿主元素，用于判断点击是否发生在气泡内部 */
  host: HTMLElement
}

interface SelectionAnchor {
  text: string
  x: number
  y: number
}

const MAX_SELECTION_LENGTH = 2000
const BUBBLE_WIDTH = 320
const BUBBLE_MARGIN = 12
const BUBBLE_MAX_HEIGHT = 560

const IFRAME_URL =
  'https://www.doubao.com/chat/38449798387118850?channel=dbweb_y_sem_ty_bsbx_ssbsbx_shbs_ocpc_faxx'
/** iframe 内容缩放比例，0.8 = 80% */
const IFRAME_SCALE = 0.8
/** iframe 缩放后的可视高度（px） */
const IFRAME_HEIGHT = 400

/**
 * 先按 1/scale 放大 iframe 的布局视口，再用 transform 缩回去：
 * 内容按 scale 缩小，但外框仍精确填满容器。
 */
const IFRAME_STYLE: CSSProperties = {
  width: `${100 / IFRAME_SCALE}%`,
  height: `${IFRAME_HEIGHT / IFRAME_SCALE}px`,
  transform: `scale(${IFRAME_SCALE})`,
}

export function SelectionBubble({ host }: SelectionBubbleProps) {
  const { settings } = useSettings()
  const [anchor, setAnchor] = useState<SelectionAnchor | null>(null)
  const [result, setResult] = useState<TranslationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const translate = useCallback(
    async (text: string) => {
      setIsLoading(true)
      setError(null)

      const response = await sendMessage({
        type: 'translate',
        payload: { text, targetLang: settings.targetLang },
      })

      setIsLoading(false)
      if (response.ok) {
        setResult(response.data)
      } else {
        setError(response.error)
      }
    },
    [settings.targetLang],
  )

  useEffect(() => {
    const handleMouseUp = (event: MouseEvent) => {
      // 点击气泡内部时不重新计算选区
      if (event.composedPath().includes(host)) {
        return
      }

      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) {
        return
      }

      const text = selection.toString().trim()
      if (text.length === 0 || text.length > MAX_SELECTION_LENGTH) {
        return
      }

      const rect = selection.getRangeAt(0).getBoundingClientRect()
      setAnchor({ text, x: rect.left + rect.width / 2, y: rect.bottom })
      setResult(null)
      setError(null)

      if (settings.autoTranslate) {
        void translate(text)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAnchor(null)
      }
    }

    const handleScroll = () => setAnchor(null)

    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('keydown', handleEscape)
    window.addEventListener('scroll', handleScroll, true)

    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [host, settings.autoTranslate, translate])

  if (!anchor) {
    return null
  }

  const left = Math.min(
    Math.max(anchor.x - BUBBLE_WIDTH / 2, BUBBLE_MARGIN),
    window.innerWidth - BUBBLE_WIDTH - BUBBLE_MARGIN,
  )
  const top = Math.min(
    anchor.y + 10,
    Math.max(BUBBLE_MARGIN, window.innerHeight - BUBBLE_MAX_HEIGHT),
  )

  return (
    <div className="bubble" style={{ left, top }} role="dialog" aria-label="AI 翻译">
      <div className="bubble__header">
        <span className="bubble__title">AI 翻译</span>
        <button
          type="button"
          className="bubble__close"
          aria-label="关闭"
          onClick={() => setAnchor(null)}
        >
          ×
        </button>
      </div>

      <p className="bubble__source">{anchor.text}</p>

      {isLoading && <p className="bubble__status">翻译中…</p>}
      {error && (
        <p className="bubble__error" role="alert">
          {error}
        </p>
      )}
      {result && <p className="bubble__result">{result.translatedText}</p>}

      <div className="bubble__iframe-wrap" style={{ height: IFRAME_HEIGHT }}>
        <iframe className="bubble__iframe" src={IFRAME_URL} title="豆包对话" style={IFRAME_STYLE} />
      </div>

      {!result && !isLoading && !error && !settings.autoTranslate && (
        <button
          type="button"
          className="bubble__action"
          onClick={() => void translate(anchor.text)}
        >
          翻译
        </button>
      )}
    </div>
  )
}
