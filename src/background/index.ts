import { isExtensionMessage, type MessageResponse, type ResponseMap } from '@/shared/messages'
import { toErrorMessage } from '@/utils/error'
import { mockTranslate } from './mock-translator'

chrome.runtime.onInstalled.addListener((details) => {
  console.info(`[ai-translator] ${details.reason === 'install' ? '已安装' : '已更新'}`)
})

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  // 只接受本扩展发出的消息，避免网页或其他扩展伪造
  if (sender.id !== chrome.runtime.id) {
    return false
  }

  void handleMessage(message).then(sendResponse)
  // 返回 true 保持消息通道，等待异步 sendResponse
  return true
})

async function handleMessage(message: unknown): Promise<MessageResponse<unknown>> {
  if (!isExtensionMessage(message)) {
    return { ok: false, error: '无法识别的消息类型' }
  }

  try {
    if (message.type === 'ping') {
      const data: ResponseMap['ping'] = {
        pong: true,
        version: chrome.runtime.getManifest().version,
      }
      return { ok: true, data }
    }

    return { ok: true, data: await mockTranslate(message.payload) }
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) }
  }
}
