import { createRoot } from 'react-dom/client'
import { SelectionBubble } from './SelectionBubble'
import styles from './content.css?inline'

const HOST_ID = 'ai-translator-root'

function mount(): void {
  if (document.getElementById(HOST_ID)) {
    return
  }

  const host = document.createElement('div')
  host.id = HOST_ID

  // 使用 Shadow DOM 隔离页面样式，避免与站点互相污染
  const shadowRoot = host.attachShadow({ mode: 'open' })
  const style = document.createElement('style')
  style.textContent = styles

  const container = document.createElement('div')
  container.id = 'ai-translator-container'
  shadowRoot.append(style, container)
  document.documentElement.append(host)

  const root = createRoot(container)
  root.render(<SelectionBubble host={host} />)

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      root.unmount()
      host.remove()
    })
  }
}

// 防止 crxjs HMR 重复注入
if (!document.getElementById(HOST_ID)) {
  mount()
}
