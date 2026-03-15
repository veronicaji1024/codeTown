import type { LibraryItem } from '@codetown/shared'

const MAX_CHARS = 3000

export function buildLibraryContext(items: LibraryItem[]): string {
  if (!items.length) return ''

  const chunks: string[] = []
  let total = 0

  for (const item of items) {
    const label = item.original_name || '未命名文档'
    const text = item.extracted_text?.trim() || ''
    if (!text) continue

    const entry = `【${label}】\n${text}`
    if (total + entry.length > MAX_CHARS) {
      const remain = Math.max(0, MAX_CHARS - total)
      if (remain > 60) chunks.push(entry.slice(0, remain) + '…')
      break
    }

    chunks.push(entry)
    total += entry.length
  }

  if (chunks.length === 0) return ''

  return `图书馆参考内容（请优先依据这些资料生成内容）：\n${chunks.join('\n\n')}`
}
