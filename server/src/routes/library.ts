import { Router } from 'express'
import multer from 'multer'
import crypto from 'node:crypto'
import fs from 'node:fs'
import { requireAuth } from '../middleware/auth'
import { extractText } from '../services/LibraryExtractor'
import { supabase } from '../lib/supabase'

const upload = multer({
  dest: '/tmp/codetown-uploads',
  limits: { fileSize: 500 * 1024 }, // 500KB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.txt', '.md', '.doc', '.docx']
    const ext = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase()
    if (allowed.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error(`不支持的文件格式：${ext}，仅支持 .txt .md .doc .docx`))
    }
  },
})

const router = Router()

// POST /api/library/upload
router.post('/library/upload', requireAuth, upload.single('file'), async (req, res) => {
  const file = req.file
  if (!file) {
    res.status(400).json({ error: 'No file uploaded' })
    return
  }

  try {
    // 提取文本内容
    const content = await extractText(file.path, file.originalname)

    // 上传到 Supabase Storage
    const uuid = crypto.randomUUID()
    const storagePath = `${req.userId}/4/${uuid}_${file.originalname}`
    const fileBuffer = await fs.promises.readFile(file.path)

    const { error: uploadError } = await supabase.storage
      .from('library-uploads')
      .upload(storagePath, fileBuffer, {
        contentType: file.mimetype,
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError)
      res.status(500).json({ error: 'File upload to storage failed' })
      return
    }

    res.json({
      content,
      fileName: file.originalname,
      charCount: content.length,
    })
  } catch (err) {
    console.error('Library upload error:', err)
    if (err instanceof Error && err.message.startsWith('不支持的文件格式')) {
      res.status(400).json({ error: err.message })
    } else {
      res.status(500).json({ error: 'File processing failed' })
    }
  } finally {
    // 清理临时文件
    if (file.path) {
      fs.promises.unlink(file.path).catch(() => {})
    }
  }
})

export default router
