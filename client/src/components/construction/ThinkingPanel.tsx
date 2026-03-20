import { useEffect, useRef } from 'react'
import ThinkingMessage from './ThinkingMessage'
import type { ThinkingMessageData } from './mockData'

interface ThinkingPanelProps {
  messages: ThinkingMessageData[]
}

export default function ThinkingPanel({ messages }: ThinkingPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div
      data-ws-id="thinking-panel"
      style={{
        height: '100%',
        backgroundColor: '#D4EAFC',
        padding: '24px 20px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <h2
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: '#1A1A1A',
          marginBottom: 16,
        }}
      >
        思索过程
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {messages.map((msg, idx) => {
          const prev = idx > 0 ? messages[idx - 1] : null
          const showHeader = !prev || prev.agentId !== msg.agentId
          return (
            <ThinkingMessage
              key={msg.id}
              agentName={msg.agentName}
              content={msg.content}
              icon={msg.icon}
              color={msg.color}
              showHeader={showHeader}
            />
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
