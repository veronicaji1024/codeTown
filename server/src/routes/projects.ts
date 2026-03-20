import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { normalizeSpec } from '../services/MetaPlanner'
import { supabase } from '../lib/supabase'
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

// GET /api/projects — 当前用户的所有项目
router.get('/projects', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, level, status, share_slug, completed_at')
      .eq('user_id', req.userId!)
      .order('created_at', { ascending: false })

    if (error) {
      res.status(500).json({ error: 'Failed to fetch projects' })
      return
    }
    res.json(data || [])
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/projects/:id — 完整项目记录（仅项目所有者）
router.get('/projects/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId!)
      .single()

    if (error || !data) {
      res.status(404).json({ error: 'Project not found' })
      return
    }
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/p/:slug — 公开分享页（无需认证）
router.get('/p/:slug', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('output_html, name')
      .eq('share_slug', req.params.slug)
      .single()

    if (error || !data) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    // 查询项目作者名
    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('share_slug', req.params.slug)
      .single()

    let authorName = '小匠'
    if (project?.user_id) {
      const { data: user } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', project.user_id)
        .single()
      if (user?.display_name) authorName = user.display_name
    }

    res.json({
      outputHtml: data.output_html,
      projectName: data.name,
      authorName,
    })
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
