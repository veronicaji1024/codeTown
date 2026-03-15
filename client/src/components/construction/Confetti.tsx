import { useMemo } from 'react'

const COLORS = [
  '#E5594F', '#3385FF', '#4CAF50', '#FFC107',
  '#9C27B0', '#00BCD4', '#FF9800', '#E91E63',
]

interface ConfettiPiece {
  left: string
  width: number
  height: number
  color: string
  delay: string
  duration: string
  swayDuration: string
}

export default function Confetti({ count = 60 }: { count?: number }) {
  const pieces = useMemo<ConfettiPiece[]>(() => {
    return Array.from({ length: count }, () => ({
      left: `${Math.random() * 100}%`,
      width: 6 + Math.random() * 6,
      height: 10 + Math.random() * 14,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: `${Math.random() * 3}s`,
      duration: `${2 + Math.random() * 3}s`,
      swayDuration: `${1 + Math.random() * 2}s`,
    }))
  }, [count])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {pieces.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: p.left,
            top: 0,
            animation: `fall ${p.duration} ${p.delay} ease-in forwards`,
          }}
        >
          <div
            style={{
              width: p.width,
              height: p.height,
              backgroundColor: p.color,
              borderRadius: 2,
              animation: `sway ${p.swayDuration} ${p.delay} ease-in-out infinite alternate`,
            }}
          />
        </div>
      ))}
    </div>
  )
}
