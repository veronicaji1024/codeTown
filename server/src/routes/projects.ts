import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { normalizeSpec } from '../services/MetaPlanner'
import type { ProjectSpec } from '@codetown/shared'

const router = Router()

// POST /api/meta-plan — 规范化 ProjectSpec
router.post('/meta-plan', requireAuth, async (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string | undefined
  if (!apiKey) {
    res.status(400).json({ error: 'X-API-Key header is required' })
    return
  }

  const spec = req.body as ProjectSpec
  if (!spec || !spec.brief?.text) {
    res.status(400).json({ error: 'Invalid ProjectSpec: brief.text is required' })
    return
  }

  const normalized = normalizeSpec(spec)
  res.json({ spec: normalized })
})

export default router
