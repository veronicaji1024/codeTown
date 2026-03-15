interface ThinkingMessageProps {
  agentName: string
  content: string
  icon: string
  showHeader: boolean
}

export default function ThinkingMessage({ agentName, content, icon, showHeader }: ThinkingMessageProps) {
  return (
    <div
      data-ws-id="thinking-message"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 14px',
        backgroundColor: '#F79B6D',
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
        {!showHeader && null}
        {content}
      </span>
    </div>
  )
}
