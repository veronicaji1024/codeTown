import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function AuthPage() {
  const { signUp, signIn, error, clearError } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  function validate(): string | null {
    if (!EMAIL_RE.test(email)) return '请输入有效的邮箱地址'
    if (password.length < 8) return '密码至少 8 位'
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setValidationError(err); return }
    setValidationError(null)
    setSuccessMsg(null)
    setSubmitting(true)
    if (isRegister) {
      const ok = await signUp(email, password, 'email')
      if (ok) {
        setSuccessMsg('注册成功！请查收邮箱中的确认链接，确认后即可登录。')
      }
    } else {
      await signIn(email, password, 'email')
    }
    setSubmitting(false)
  }

  function toggleMode() {
    setIsRegister(!isRegister)
    setValidationError(null)
    setSuccessMsg(null)
    clearError()
  }

  const displayError = validationError || error

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      <div
        className="w-full max-w-[480px] mx-4"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          padding: '40px',
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        <h1
          className="text-center font-bold"
          style={{ fontSize: '32px', color: 'var(--color-primary)' }}
        >
          CodeTown
        </h1>
        <p
          className="text-center mt-2 mb-8"
          style={{ fontSize: '14px', color: 'var(--text-secondary)' }}
        >
          建设你的小镇，学会 Vibe Coding
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="flex h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
              style={{
                borderColor: 'var(--color-divider)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <input
              id="password"
              type="password"
              placeholder="至少 8 位"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="flex h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
              style={{
                borderColor: 'var(--color-divider)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {displayError && (
            <p className="text-sm" style={{ color: 'var(--color-error)' }}>
              {displayError}
            </p>
          )}

          {successMsg && (
            <p className="text-sm" style={{ color: 'var(--color-success)' }}>
              {successMsg}
            </p>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full cursor-pointer text-base font-medium"
            style={{
              height: '48px',
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              borderRadius: 'var(--radius-md)',
            }}
          >
            {submitting ? '请稍候...' : isRegister ? '注册账号' : '进入小镇'}
          </Button>
        </form>

        <p
          className="mt-6 text-center text-sm cursor-pointer underline"
          style={{ color: 'var(--text-secondary)' }}
          onClick={toggleMode}
        >
          {isRegister ? '已有账号？登录' : '没有账号？注册'}
        </p>
      </div>
    </div>
  )
}
