import { useState } from 'react'
import { Key } from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface BYOKModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onKeySubmit: (key: string) => void
}

export default function BYOKModal({ open, onOpenChange, onKeySubmit }: BYOKModalProps) {
  const [key, setKey] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit() {
    if (!key.trim()) {
      setError('请输入 API Key')
      return
    }
    if (!/^sk-[A-Za-z0-9]/.test(key)) {
      setError('API Key 格式不正确，应以 sk- 开头')
      return
    }
    setError(null)
    onKeySubmit(key.trim())
    setKey('')
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setKey('')
      setError(null)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" style={{ backgroundColor: 'var(--bg-surface)' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key size={24} weight="duotone" style={{ color: 'var(--color-primary)' }} />
            获取建筑许可证
          </DialogTitle>
          <DialogDescription>
            输入你的 Opencode API Key 以使用 AI 建造能力。Key 仅存储在当前浏览器标签页中，关闭标签页后自动清除。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <input
              id="api-key"
              type="password"
              placeholder="sk-..."
              value={key}
              onChange={e => { setKey(e.target.value); setError(null) }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="flex h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
              style={{
                borderColor: 'var(--color-divider)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>
          )}

          <Button
            onClick={handleSubmit}
            className="w-full cursor-pointer text-base font-medium"
            style={{
              height: '48px',
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              borderRadius: 'var(--radius-md)',
            }}
          >
            获取许可证，开始建造！
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
