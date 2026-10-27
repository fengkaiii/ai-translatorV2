#!/usr/bin/env node
/**
 * 生成扩展图标（纯 Node，无图像依赖）。
 * 用法：npm run icons
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const OUTPUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../public/icons')
const SIZES = [16, 32, 48, 128]
const BACKGROUND = [79, 70, 229]
const FOREGROUND = [255, 255, 255]
const SUPERSAMPLING = 4

const ROUNDED_INSET = 0.02
const ROUNDED_RADIUS = 0.2

// 字母 A 的三条笔画（归一化坐标）
const GLYPH_SEGMENTS = [
  [0.5, 0.23, 0.3, 0.75],
  [0.5, 0.23, 0.7, 0.75],
  [0.385, 0.56, 0.615, 0.56],
]
const GLYPH_HALF_STROKE = 0.038

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function createChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii')
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])))
  return Buffer.concat([length, typeBuffer, data, crc])
}

function encodePng(width, height, rgba) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8 // 位深
  header[9] = 6 // RGBA

  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    createChunk('IHDR', header),
    createChunk('IDAT', deflateSync(raw, { level: 9 })),
    createChunk('IEND', Buffer.alloc(0)),
  ])
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax
  const aby = by - ay
  const apx = px - ax
  const apy = py - ay
  const lengthSquared = abx * abx + aby * aby
  const t =
    lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, (apx * abx + apy * aby) / lengthSquared))
  return Math.hypot(apx - abx * t, apy - aby * t)
}

function isInsideRoundedSquare(u, v) {
  const min = ROUNDED_INSET
  const max = 1 - ROUNDED_INSET
  if (u < min || u > max || v < min || v > max) return false
  const cx = Math.min(Math.max(u, min + ROUNDED_RADIUS), max - ROUNDED_RADIUS)
  const cy = Math.min(Math.max(v, min + ROUNDED_RADIUS), max - ROUNDED_RADIUS)
  return Math.hypot(u - cx, v - cy) <= ROUNDED_RADIUS
}

function renderIcon(size) {
  const scale = size * SUPERSAMPLING
  const hires = new Uint8ClampedArray(scale * scale * 4)

  for (let y = 0; y < scale; y += 1) {
    for (let x = 0; x < scale; x += 1) {
      const u = (x + 0.5) / scale
      const v = (y + 0.5) / scale
      if (!isInsideRoundedSquare(u, v)) continue

      const index = (y * scale + x) * 4
      const glyphDistance = Math.min(
        ...GLYPH_SEGMENTS.map(([ax, ay, bx, by]) => distanceToSegment(u, v, ax, ay, bx, by)),
      )
      const [r, g, b] = glyphDistance <= GLYPH_HALF_STROKE ? FOREGROUND : BACKGROUND
      hires[index] = r
      hires[index + 1] = g
      hires[index + 2] = b
      hires[index + 3] = 255
    }
  }

  // 降采样（按预乘 alpha 平均，保证边缘干净）
  const output = Buffer.alloc(size * size * 4)
  const samplesPerPixel = SUPERSAMPLING * SUPERSAMPLING
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0
      let g = 0
      let b = 0
      let alpha = 0
      for (let sy = 0; sy < SUPERSAMPLING; sy += 1) {
        for (let sx = 0; sx < SUPERSAMPLING; sx += 1) {
          const index = ((y * SUPERSAMPLING + sy) * scale + (x * SUPERSAMPLING + sx)) * 4
          const a = hires[index + 3] / 255
          r += hires[index] * a
          g += hires[index + 1] * a
          b += hires[index + 2] * a
          alpha += a
        }
      }

      const index = (y * size + x) * 4
      if (alpha > 0) {
        output[index] = Math.round(r / alpha)
        output[index + 1] = Math.round(g / alpha)
        output[index + 2] = Math.round(b / alpha)
      }
      output[index + 3] = Math.round((alpha / samplesPerPixel) * 255)
    }
  }

  return encodePng(size, size, output)
}

mkdirSync(OUTPUT_DIR, { recursive: true })
for (const size of SIZES) {
  const file = resolve(OUTPUT_DIR, `icon${size}.png`)
  writeFileSync(file, renderIcon(size))
  console.log(`generated ${file}`)
}
