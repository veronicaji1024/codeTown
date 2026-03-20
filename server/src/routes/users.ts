import { Router, Request, Response } from 'express'
import { supabase } from '../lib/supabase'

const router = Router()

// GET /api/town/:username — 公开小镇页（无需认证）
router.get('/:username', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('display_name, town_state')
      .eq('display_name', req.params.username)
      .single()

    if (error || !data) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.json({
      displayName: data.display_name,
      townState: data.town_state,
    })
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
