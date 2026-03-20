import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { supabase } from '../lib/supabase'

const router = Router()

// ===== 技能包 =====

// GET /api/skills — 内置 + 当前用户自定义技能包
router.get('/skills', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .or(`is_builtin.eq.true,user_id.eq.${req.userId!}`)
      .order('is_builtin', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      res.status(500).json({ error: 'Failed to fetch skills' })
      return
    }
    res.json(data || [])
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/skills — 创建用户自定义技能包
router.post('/skills', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, target_agent, content } = req.body
    if (!name || !target_agent || !content) {
      res.status(400).json({ error: 'name, target_agent, and content are required' })
      return
    }

    const { data, error } = await supabase
      .from('skills')
      .insert({
        user_id: req.userId!,
        name,
        target_agent,
        content,
        is_builtin: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Skill insert error:', error)
      res.status(500).json({ error: 'Failed to create skill' })
      return
    }
    res.status(201).json(data)
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ===== 规则 =====

// GET /api/rules — 内置 + 当前用户自定义规则
router.get('/rules', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('rules')
      .select('*')
      .or(`is_builtin.eq.true,user_id.eq.${req.userId!}`)
      .order('is_builtin', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      res.status(500).json({ error: 'Failed to fetch rules' })
      return
    }
    res.json(data || [])
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/rules — 创建用户自定义规则
router.post('/rules', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, trigger_type, content } = req.body
    if (!name || !trigger_type || !content) {
      res.status(400).json({ error: 'name, trigger_type, and content are required' })
      return
    }

    const { data, error } = await supabase
      .from('rules')
      .insert({
        user_id: req.userId!,
        name,
        trigger_type,
        content,
        is_builtin: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Rule insert error:', error)
      res.status(500).json({ error: 'Failed to create rule' })
      return
    }
    res.status(201).json(data)
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
