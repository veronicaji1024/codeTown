import type { Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

interface ElementPosition {
  id: string
  left: string
  top: string
  width: string
}

export default function devSavePositionsPlugin(): Plugin {
  return {
    name: 'dev-save-positions',
    apply: 'serve', // dev only
    configureServer(server) {
      server.middlewares.use('/__dev/save-positions', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        let body = ''
        req.on('data', (chunk: Buffer) => { body += chunk.toString() })
        req.on('end', () => {
          try {
            const elements: ElementPosition[] = JSON.parse(body)
            if (!Array.isArray(elements) || elements.length === 0) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Invalid elements array' }))
              return
            }

            const filePath = path.resolve(
              __dirname,
              'src/components/workspace/WorkspaceView.tsx',
            )
            const source = fs.readFileSync(filePath, 'utf-8')

            // Match the DEFAULT_ELEMENTS array (from opening `[` to its closing `]`)
            const startMarker = 'const DEFAULT_ELEMENTS: ElementPosition[] = ['
            const startIdx = source.indexOf(startMarker)
            if (startIdx === -1) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: 'Cannot find DEFAULT_ELEMENTS in source' }))
              return
            }

            // Find the matching closing bracket
            const arrayStart = startIdx + startMarker.length - 1 // index of `[`
            let depth = 1
            let i = arrayStart + 1
            while (i < source.length && depth > 0) {
              if (source[i] === '[') depth++
              else if (source[i] === ']') depth--
              i++
            }
            const arrayEnd = i // one past the `]`

            // Build replacement array code
            const lines = elements.map(el => {
              const id = el.id.padEnd(20)
              const left = `left: '${el.left}',`.padEnd(18)
              const top = `top: '${el.top}',`.padEnd(18)
              const width = `width: '${el.width}'`
              return `  { id: '${id}${left} ${top} ${width} },`
            })

            // Group with comments matching original style
            const folderIcons = lines.filter((_, idx) => elements[idx].id.startsWith('folder-'))
            const labels = lines.filter((_, idx) => elements[idx].id.startsWith('label-'))
            const rest = lines.filter((_, idx) => {
              const id = elements[idx].id
              return !id.startsWith('folder-') && !id.startsWith('label-')
            })

            const sections: string[] = []
            if (folderIcons.length) {
              sections.push('  // 9 folder icons')
              sections.push(...folderIcons)
            }
            if (labels.length) {
              sections.push('  // 9 folder labels (independent, can be positioned separately)')
              sections.push(...labels)
            }
            if (rest.length) {
              sections.push('  // Decorations & layout')
              sections.push(...rest)
            }

            const newArray = `[\n${sections.join('\n')}\n]`
            const newSource =
              source.slice(0, arrayStart) + newArray + source.slice(arrayEnd)

            fs.writeFileSync(filePath, newSource, 'utf-8')

            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 200
            res.end(JSON.stringify({ ok: true }))
          } catch (err) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: String(err) }))
          }
        })
      })
    },
  }
}
