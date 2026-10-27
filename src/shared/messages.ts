import { toErrorMessage } from '@/utils/error'
import { isRecord } from './guards'

export const TARGET_LANGS = ['zh-CN', 'en', 'ja', 'ko', 'fr', 'de'] as const

export type TargetLang = (typeof TARGET_LANGS)[number]

const TARGET_LANG_SET: ReadonlySet<string> = new Set(TARGET_LANGS)

export function isTargetLang(value: unknown): value is TargetLang {
  return typeof value === 'string' && TARGET_LANG_SET.has(value)
}

export interface TranslatePayload {
  text: string
  targetLang: TargetLang
}

/** 扩展内所有消息的统一联合类型，新增消息时在这里扩展 */
export type ExtensionMessage = { type: 'ping' } | { type: 'translate'; payload: TranslatePayload }

export interface PingResult {
  pong: true
  version: string
}

export interface TranslationResult {
  sourceText: string
  translatedText: string
  targetLang: TargetLang
  /** 翻译来源，接入真实服务后替换为具体 provider 名 */
  provider: 'mock'
}

/** 消息类型 → 响应 data 的映射 */
export interface ResponseMap {
  ping: PingResult
  translate: TranslationResult
}

export type MessageResponse<T> = { ok: true; data: T } | { ok: false; error: string }

export function isExtensionMessage(value: unknown): value is ExtensionMessage {
  if (!isRecord(value)) {
    return false
  }

  switch (value.type) {
    case 'ping':
      return true
    case 'translate':
      return (
        isRecord(value.payload) &&
        typeof value.payload.text === 'string' &&
        isTargetLang(value.payload.targetLang)
      )
    default:
      return false
  }
}

export function isMessageResponse(value: unknown): value is MessageResponse<unknown> {
  if (!isRecord(value) || typeof value.ok !== 'boolean') {
    return false
  }
  return value.ok ? 'data' in value : typeof value.error === 'string'
}

/**
 * 向后台发送类型安全的消息。
 * content script 在扩展重新加载后会失联，这里统一转成 { ok: false } 而不是抛出。
 */
export async function sendMessage<M extends ExtensionMessage>(
  message: M,
): Promise<MessageResponse<ResponseMap[M['type']]>> {
  try {
    const raw: unknown = await chrome.runtime.sendMessage(message)
    if (!isMessageResponse(raw)) {
      return { ok: false, error: '后台返回了无法识别的响应' }
    }
    // isMessageResponse 只校验外层结构，data 的类型由消息类型约定保证
    return raw as MessageResponse<ResponseMap[M['type']]>
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) }
  }
}
