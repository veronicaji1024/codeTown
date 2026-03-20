import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { supabase } from '../lib/supabase'

const router = Router()

// GET /api/drafts/:level — 获取该用户该关卡的草稿
router.get('/drafts/:level', requireAuth, async (req: Request, res: Response) => {
  try {
    const level = parseInt(req.params.level, 10)
    if (isNaN(level) || level < 1 || level > 4) {
      res.status(400).json({ error: 'level must be 1-4' })
      return
    }

    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('user_id', req.userId!)
      .eq('level', level)
      .single()

    if (error || !data) {
      res.json(null)
      return
    }
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/drafts/:level — Upsert 草稿
router.put('/drafts/:level', requireAuth, async (req: Request, res: Response) => {
  try {
    const level = parseInt(req.params.level, 10)
    if (isNaN(level) || level < 1 || level > 4) {
      res.status(400).json({ error: 'level must be 1-4' })
      return
    }

    const specJson = req.body
    if (!specJson || typeof specJson !== 'object') {
      res.status(400).json({ error: 'Request body must be a JSON object' })
      return
    }

    const { data, error } = await supabase
      .from('drafts')
      .upsert(
        { user_id: req.userId!, level, spec_json: specJson },
        { onConflict: 'user_id,level' }
      )
      .select()
      .single()

    if (error) {
      console.error('Draft upsert error:', error)
      res.status(500).json({ error: 'Failed to save draft' })
      return
    }
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/drafts/:level — 删除草稿（构建成功后调用）
router.delete('/drafts/:level', requireAuth, async (req: Request, res: Response) => {
  try {
    const level = parseInt(req.params.level, 10)
    if (isNaN(level) || level < 1 || level > 4) {
      res.status(400).json({ error: 'level must be 1-4' })
      return
    }

    const { error } = await supabase
      .from('drafts')
      .delete()
      .eq('user_id', req.userId!)
      .eq('level', level)

    if (error) {
      res.status(500).json({ error: 'Failed to delete draft' })
      return
    }
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
