import { Router, Request, Response } from 'express'
import crypto from 'node:crypto'
import { supabase } from '../lib/supabase'
import { requireAuth } from '../middleware/auth'

const router = Router()

// GET /api/user/me — 获取当前用户信息
router.get('/user/me', requireAuth, async (req: Request, res: Response) => {
  const { data: userData, error } = await supabase
    .from('users')
    .select('id, email, display_name, current_level, town_state, api_key_hash')
    .eq('id', req.userId!)
    .single()

  if (error || !userData) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  const { api_key_hash, ...user } = userData
  res.json({ user: { ...user, has_api_key: !!api_key_hash } })
})

// POST /api/auth/byok — 保存用户 API Key 的 SHA-256 哈希
router.post('/auth/byok', requireAuth, async (req: Request, res: Response) => {
  const { apiKey } = req.body
  if (!apiKey) {
    res.status(400).json({ error: 'apiKey is required' })
    return
  }

  const hash = crypto.createHash('sha256').update(apiKey).digest('hex')
  const { error } = await supabase
    .from('users')
    .update({ api_key_hash: hash })
    .eq('id', req.userId!)

  if (error) {
    res.status(500).json({ error: 'Failed to update API key hash' })
    return
  }

  res.json({ success: true })
})

// POST /api/auth/refresh — 刷新 Supabase session
router.post('/auth/refresh', async (req: Request, res: Response) => {
  const { refresh_token } = req.body
  if (!refresh_token) {
    res.status(400).json({ error: 'refresh_token is required' })
    return
  }

  const { data, error } = await supabase.auth.refreshSession({ refresh_token })
  if (error || !data.session) {
    res.status(401).json({ error: 'Failed to refresh session' })
    return
  }

  res.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
  })
})

export default router
