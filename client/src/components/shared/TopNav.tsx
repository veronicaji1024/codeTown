import { useState } from 'react'
import { Buildings, SpeakerHigh, SpeakerSlash, Coin } from '@phosphor-icons/react'
import type { User } from '@supabase/supabase-js'

interface TopNavProps {
  user: User
  onSignOut: () => void
}

export default function TopNav({ user }: TopNavProps) {
  const [soundOn, setSoundOn] = useState(true)

  const nickname = user.user_metadata?.nickname
    ?? user.email?.split('@')[0]
    ?? '居民'

  return (
    <nav
      className="flex items-center justify-between px-5 shrink-0"
      style={{
        height: 'var(--topbar-height)',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--color-divider)',
      }}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-2">
        <Buildings size={22} weight="bold" style={{ color: 'var(--color-primary)' }} />
        <span
          className="font-bold"
          style={{ fontSize: '18px', color: 'var(--color-primary)' }}
        >
          CodeTown
        </span>
      </div>

      {/* Right: Token + Nickname + Sound */}
      <div className="flex items-center gap-4">
        {/* Token display */}
        <div
          className="flex items-center gap-1 rounded-full px-3 py-1"
          style={{ backgroundColor: 'var(--bg-base)' }}
        >
          <Coin size={16} weight="fill" style={{ color: 'var(--color-warning)' }} />
          <span
            className="font-bold"
            style={{ fontSize: '13px', color: 'var(--text-primary)' }}
          >
            0
          </span>
        </div>

        {/* User nickname */}
        <span
          className="font-medium"
          style={{ fontSize: '13px', color: 'var(--text-secondary)' }}
        >
          {nickname}
        </span>

        {/* Sound toggle */}
        <button
          onClick={() => setSoundOn(prev => !prev)}
          className="flex cursor-pointer items-center justify-center rounded-md p-1"
          style={{ color: 'var(--text-secondary)' }}
          aria-label={soundOn ? '关闭音效' : '开启音效'}
        >
          {soundOn
            ? <SpeakerHigh size={20} weight="regular" />
            : <SpeakerSlash size={20} weight="regular" />
          }
        </button>
      </div>
    </nav>
  )
}
