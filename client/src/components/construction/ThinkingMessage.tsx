import type { ReactNode } from 'react'

interface ThinkingMessageProps {
  agentName: string
  content: string
  icon: string
  color: string
  showHeader: boolean
}

function parseContent(content: string): { isDone: boolean; text: string } {
  if (content.startsWith('[完成] ')) {
    return { isDone: true, text: content.slice(5) }
  }
  return { isDone: false, text: content }
}

function renderInlineCode(text: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`)/)
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          style={{
            fontFamily: 'monospace',
            backgroundColor: 'rgba(0,0,0,0.15)',
            borderRadius: 4,
            padding: '1px 5px',
          }}
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export default function ThinkingMessage({ agentName, content, icon, color, showHeader }: ThinkingMessageProps) {
  const { isDone, text } = parseContent(content)

  return (
    <div
      data-ws-id="thinking-message"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 14px',
        backgroundColor: color,
        borderRadius: 12,
        marginTop: 12,
      }}
    >
      <img
        src={icon}
        alt=""
        style={{ width: 20, height: 20, flexShrink: 0, marginTop: 2 }}
        draggable={false}
      />
      <span style={{ fontSize: 14, color: '#fff', lineHeight: 1.5 }}>
        {showHeader && <strong>{agentName}：</strong>}
        {isDone && (
          <span
            style={{
              display: 'inline-block',
              backgroundColor: '#4CAF50',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 4,
              padding: '1px 6px',
              marginRight: 6,
              verticalAlign: 'middle',
            }}
          >
            完成
          </span>
        )}
        {renderInlineCode(text)}
      </span>
    </div>
  )
}
