/** 把任意 catch 到的值转成可展示的错误文案 */
export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return '未知错误'
}
