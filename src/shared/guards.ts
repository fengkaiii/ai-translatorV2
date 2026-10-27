/** 判断一个 unknown 值是否为普通对象（用于消息、存储等运行时边界） */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
