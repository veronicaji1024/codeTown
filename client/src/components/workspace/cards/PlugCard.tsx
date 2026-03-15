import { Plus, Trash } from '@phosphor-icons/react'
import type { ProjectSpecHook } from '@/hooks/useProjectSpec'
import type { Plug } from '@codetown/shared'

interface PlugCardProps {
  level: number
  projectSpec: ProjectSpecHook
}

let plugCounter = 0

export default function PlugCard({ level, projectSpec }: PlugCardProps) {
  const { spec, addPlug, removePlug } = projectSpec

  function handleAddUnsplash() {
    addPlug({
      id: `plug-${Date.now()}-${plugCounter++}`,
      plug_type: 'unsplash',
      config: { keyword: '' },
    })
  }

  function handleAddMapbox() {
    addPlug({
      id: `plug-${Date.now()}-${plugCounter++}`,
      plug_type: 'mapbox',
      config: { location: '' },
    })
  }

  function handleAddMagic() {
    addPlug({
      id: `plug-${Date.now()}-${plugCounter++}`,
      plug_type: 'magic',
      config: { description: '' },
    })
  }

  function getPlugLabel(plug: Plug) {
    switch (plug.plug_type) {
      case 'unsplash': return '图片搜索'
      case 'mapbox': return '地图定位'
      case 'magic': return '魔法连接'
    }
  }

  function getPlugEmoji(plug: Plug) {
    switch (plug.plug_type) {
      case 'unsplash': return '📷'
      case 'mapbox': return '🗺️'
      case 'magic': return '✨'
    }
  }

  return (
    <div className="p-3" style={{ borderTop: '6px solid var(--comp-plug)' }}>
      <div className="mb-2 font-semibold" style={{ fontSize: 'var(--text-sm)', color: 'var(--comp-plug)' }}>
        Plug（外部连接）
      </div>

      <div className="flex flex-col gap-2">
        {spec.plugs.map(plug => (
          <div
            key={plug.id}
            className="rounded-md p-2"
            style={{ backgroundColor: 'var(--bg-base)', fontSize: 'var(--text-sm)' }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span style={{ fontSize: 14 }}>{getPlugEmoji(plug)}</span>
              <span className="flex-1 font-medium text-xs" style={{ color: 'var(--text-primary)' }}>
                {getPlugLabel(plug)}
              </span>
              <button
                onClick={() => removePlug(plug.id)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}
              >
                <Trash size={14} style={{ color: 'var(--color-error)' }} />
              </button>
            </div>

            {plug.plug_type === 'unsplash' && (
              <input
                type="text"
                value={plug.config.keyword}
                onChange={e => {
                  removePlug(plug.id)
                  addPlug({ ...plug, config: { keyword: e.target.value } })
                }}
                placeholder="搜索关键词（如：bread, bakery）"
                className="w-full rounded border px-2 py-1 text-xs outline-none"
                style={{ borderColor: 'var(--color-divider)', color: 'var(--text-primary)' }}
              />
            )}

            {plug.plug_type === 'mapbox' && (
              <input
                type="text"
                value={plug.config.location}
                onChange={e => {
                  removePlug(plug.id)
                  addPlug({ ...plug, config: { location: e.target.value } })
                }}
                placeholder="地点（如：上海市南京路）"
                className="w-full rounded border px-2 py-1 text-xs outline-none"
                style={{ borderColor: 'var(--color-divider)', color: 'var(--text-primary)' }}
              />
            )}

            {plug.plug_type === 'magic' && (
              <textarea
                value={plug.config.description}
                onChange={e => {
                  removePlug(plug.id)
                  addPlug({ ...plug, config: { description: e.target.value } })
                }}
                placeholder="描述你想连接的外部能力..."
                rows={2}
                className="w-full resize-none rounded border px-2 py-1 text-xs outline-none"
                style={{ borderColor: 'var(--color-divider)', color: 'var(--text-primary)' }}
              />
            )}
          </div>
        ))}

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={handleAddUnsplash}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs"
            style={{
              border: '1px dashed var(--color-divider)',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <Plus size={12} weight="bold" />
            图片搜索
          </button>
          <button
            onClick={handleAddMapbox}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs"
            style={{
              border: '1px dashed var(--color-divider)',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <Plus size={12} weight="bold" />
            地图定位
          </button>
          {level >= 4 && (
            <button
              onClick={handleAddMagic}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs"
              style={{
                border: '1px dashed var(--comp-plug)',
                backgroundColor: 'transparent',
                color: 'var(--comp-plug)',
                cursor: 'pointer',
              }}
            >
              <Plus size={12} weight="bold" />
              魔法连接
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
