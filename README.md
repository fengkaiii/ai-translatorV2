# AI Translator

划词翻译浏览器扩展的项目骨架：**Manifest V3 + Vite + React + TypeScript**。

内置一条可跑通的垂直切片：网页选中文字 → 气泡翻译 → 后台返回占位译文；
设置页写入 `chrome.storage.sync` 并实时同步到 popup 与 content script。

## 技术栈

| 项   | 选型                                                                                              |
| ---- | ------------------------------------------------------------------------------------------------- |
| 构建 | Vite 8 + [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin)（manifest 生成、content script HMR） |
| UI   | React 19 + TypeScript 5.9（`strict`）                                                             |
| 扩展 | Chrome MV3（Edge 兼容）                                                                           |
| 质量 | ESLint 10（flat config）+ Prettier                                                                |

## 快速开始

```bash
npm install
npm run dev
```

1. 保持 `npm run dev` 运行（crxjs 会把产物写入 `dist/`，并支持热更新）。
   dev server 固定使用 5188 端口（content script HMR 需要固定端口），被占用时会直接报错。
2. 打开 `chrome://extensions`，开启右上角「开发者模式」。
3. 点击「加载已解压的扩展程序」，选择本项目的 `dist` 目录。
4. 在任意网页选中一段文字，会出现翻译气泡；点击工具栏图标打开 popup。

> 修改背景/配置后如果没生效，在 `chrome://extensions` 里点一次刷新。

## 命令

| 命令                | 说明                             |
| ------------------- | -------------------------------- |
| `npm run dev`       | 开发模式，产物输出到 `dist/`     |
| `npm run build`     | 类型检查 + 生产构建              |
| `npm run typecheck` | 只跑 TypeScript 检查（`tsc -b`） |
| `npm run lint`      | ESLint，零警告                   |
| `npm run format`    | Prettier 格式化                  |
| `npm run icons`     | 重新生成 `public/icons/*.png`    |

## 目录结构

```text
.
├─ manifest.config.ts        # MV3 manifest（TS 编写，crxjs 生成 manifest.json）
├─ vite.config.ts            # Vite / React / crx 插件、@ 别名
├─ public/icons/             # 扩展图标（由 scripts/generate-icons.mjs 生成）
├─ scripts/generate-icons.mjs
└─ src/
   ├─ background/
   │  ├─ index.ts            # service worker：消息路由
   │  └─ mock-translator.ts  # 占位翻译实现（替换这里接入真实服务）
   ├─ content/
   │  ├─ index.tsx           # 注入页面，挂载 Shadow DOM
   │  ├─ SelectionBubble.tsx # 划词气泡
   │  └─ content.css         # 气泡样式（内联进 shadow root）
   ├─ popup/                 # 工具栏弹窗（index.html + React）
   ├─ options/               # 设置页
   ├─ components/            # 跨页面复用组件（Button）
   ├─ hooks/                 # useSettings
   ├─ shared/
   │  ├─ messages.ts         # 消息联合类型、运行时校验、sendMessage
   │  ├─ settings.ts         # 设置结构、默认值、storage 读写
   │  └─ guards.ts
   ├─ utils/                 # 纯工具函数
   └─ styles/base.css        # 设计变量与共享样式
```

## 数据流

```text
popup / content ──sendMessage()──▶ background.onMessage ──▶ mockTranslate()
      ▲                                     │
      └──────── { ok, data | error } ◀──────┘

options / popup / content ──useSettings()──▶ chrome.storage.sync
```

- 所有跨上下文消息都走 `src/shared/messages.ts` 的 `sendMessage`，入参有类型、出口做运行时校验。
- 新增消息类型：在 `ExtensionMessage` 加分支、在 `ResponseMap` 加对应返回类型、在
  `isExtensionMessage` 加校验、最后在 `src/background/index.ts` 处理。
- `chrome.runtime` 在扩展重新加载后会失联，`sendMessage` 会转成 `{ ok: false }` 而不是抛错。

## 接入真实 AI 翻译

1. 在 `src/background/mock-translator.ts` 里替换实现，例如请求你自己的 BFF。
2. **不要把 API Key 放进 `VITE_*` 环境变量**：Vite 会把它们打进产物，任何人解压 `dist`
   都能拿到。让密钥停留在服务端；如果必须由用户自备，存进 `chrome.storage` 也只能算
   降低暴露面，不能算安全。
3. 若新服务域名不在内容脚本可访问范围内，在 `manifest.config.ts` 增加 `host_permissions`。
4. 后台 `fetch` 受 MV3 service worker 生命周期影响，长任务请拆分或放到服务端。

## 权限

当前只声明 `storage`。`content_scripts.matches` 为 `<all_urls>`，因此安装时 Chrome 会提示
「读取和更改所有网站上的数据」——这是划词翻译的常规需求。

新增权限时优先考虑更窄的方案，例如用 `activeTab` + `chrome.scripting` 按需注入。

## 调试

| 目标           | 位置                                                     |
| -------------- | -------------------------------------------------------- |
| background     | `chrome://extensions` → 该扩展 → 「服务工作进程」        |
| popup          | 右键扩展图标 → 「检查弹出内容」                          |
| content script | 在网页 DevTools 的 Elements 中查找 `#ai-translator-root` |
| 存储           | DevTools → Application → Storage → Extension storage     |

## 说明

- 图标由脚本绘制生成，可以换成自己的设计后删除 `scripts/generate-icons.mjs`。
- Firefox 的 MV3 差异（`background.scripts`、`browser.*` 命名空间等）未包含在骨架内；
  如需支持，建议引入 `webextension-polyfill` 并单独维护一份 manifest。
