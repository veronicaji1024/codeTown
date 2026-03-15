import { useState } from 'react'
import { Plus, Trash, FileText, ClipboardText } from '@phosphor-icons/react'
import type { ProjectSpecHook } from '@/hooks/useProjectSpec'

interface LibraryCardProps {
  projectSpec: ProjectSpecHook
}

let libCounter = 0

export default function LibraryCard({ projectSpec }: LibraryCardProps) {
  const { spec, addLibraryItem, removeLibraryItem } = projectSpec
  const [pasteText, setPasteText] = useState('')

  function handlePaste() {
    if (!pasteText.trim()) return
    addLibraryItem({
      ref_id: `lib-${Date.now()}-${libCounter++}`,
      source_type: 'paste',
      original_name: `粘贴内容 ${spec.library.length + 1}`,
      extracted_text: pasteText.trim(),
      token_count: Math.ceil(pasteText.trim().length / 4), // rough estimate
    })
    setPasteText('')
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type and size
    const validTypes = ['.txt', '.md', '.doc', '.docx']
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!validTypes.includes(ext)) {
      alert('支持的文件格式：.txt, .md, .doc, .docx')
      return
    }
    if (file.size > 500 * 1024) {
      alert('文件大小不能超过 500KB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      addLibraryItem({
        ref_id: `lib-${Date.now()}-${libCounter++}`,
        source_type: 'file',
        original_name: file.name,
        extracted_text: text.slice(0, 2000),
        token_count: Math.ceil(text.slice(0, 2000).length / 4),
      })
    }
    reader.readAsText(file)
    e.target.value = '' // reset
  }

  return (
    <div className="p-3" style={{ borderTop: '6px solid var(--comp-library)' }}>
      <div className="mb-2 font-semibold" style={{ fontSize: 'var(--text-sm)', color: 'var(--comp-library)' }}>
        图书馆
      </div>

      <div className="flex flex-col gap-2">
        {/* Existing items */}
        {spec.library.map(item => (
          <div
            key={item.ref_id}
            className="flex items-start gap-2 rounded-md p-2"
            style={{ backgroundColor: 'var(--bg-base)', fontSize: 'var(--text-sm)' }}
          >
            {item.source_type === 'file' ? (
              <FileText size={16} style={{ color: 'var(--comp-library)', flexShrink: 0, marginTop: 2 }} />
            ) : (
              <ClipboardText size={16} style={{ color: 'var(--comp-library)', flexShrink: 0, marginTop: 2 }} />
            )}
            <div className="flex-1 overflow-hidden">
              <span className="block truncate font-medium text-xs" style={{ color: 'var(--text-primary)' }}>
                {item.original_name}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                ~{item.token_count} tokens
              </span>
            </div>
            <button
              onClick={() => removeLibraryItem(item.ref_id)}
              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}
            >
              <Trash size={14} style={{ color: 'var(--color-error)' }} />
            </button>
          </div>
        ))}

        {/* Paste area */}
        <div>
          <textarea
            value={pasteText}
            onChange={e => {
              if (e.target.value.length <= 2000) setPasteText(e.target.value)
            }}
            placeholder="粘贴参考文本（≤2000字符）..."
            rows={3}
            className="w-full resize-none rounded-md border px-2.5 py-1.5 text-xs outline-none"
            style={{
              borderColor: 'var(--color-divider)',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-surface)',
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--text-placeholder)' }}>
              {pasteText.length}/2000
            </span>
            <button
              onClick={handlePaste}
              disabled={!pasteText.trim()}
              className="rounded-md px-2 py-1 text-xs font-medium"
              style={{
                backgroundColor: pasteText.trim() ? 'var(--comp-library)' : 'var(--color-locked)',
                color: '#fff',
                border: 'none',
                cursor: pasteText.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              <Plus size={12} weight="bold" style={{ display: 'inline', verticalAlign: 'middle' }} />
              {' '}添加
            </button>
          </div>
        </div>

        {/* File upload */}
        <label
          className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium"
          style={{
            border: '1px dashed var(--comp-library)',
            color: 'var(--comp-library)',
          }}
        >
          <FileText size={14} weight="bold" />
          上传文件（.txt .md .doc .docx, ≤500KB）
          <input
            type="file"
            accept=".txt,.md,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>
    </div>
  )
}
