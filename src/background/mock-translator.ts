import type { ResponseMap, TranslatePayload } from '@/shared/messages'

/**
 * 占位翻译实现。
 *
 * 接入真实服务时替换这里。更推荐请求自己的 BFF，而不是把第三方 API Key 打进扩展包：
 * 扩展产物是明文，任何人解压 dist 都能拿到其中的密钥。
 */
export async function mockTranslate(payload: TranslatePayload): Promise<ResponseMap['translate']> {
  await new Promise((resolve) => setTimeout(resolve, 200))

  return {
    sourceText: payload.text,
    translatedText: `【${payload.targetLang}】${payload.text}`,
    targetLang: payload.targetLang,
    provider: 'mock',
  }
}
