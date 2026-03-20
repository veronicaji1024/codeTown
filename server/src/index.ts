import dotenv from 'dotenv'
import path from 'node:path'

// 加载根目录 .env（npm workspace 运行时 CWD 可能是 server/）
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
dotenv.config()

import express from 'express'
import cors from 'cors'
import { createServer } from 'node:http'
import authRoutes from './routes/auth'
import projectRoutes from './routes/projects'
import plugRoutes from './routes/plug'
import libraryRoutes from './routes/library'
import usersRoutes from './routes/users'
import draftsRoutes from './routes/drafts'
import skillsRoutes from './routes/skills'
import { setupWebSocket } from './ws/wsHandler'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5180',
  credentials: true,
}))
app.use(express.json({ limit: '1mb' }))

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 路由
app.use('/api', authRoutes)
app.use('/api', projectRoutes)
app.use('/api', plugRoutes)
app.use('/api', libraryRoutes)
app.use('/api/town', usersRoutes)
app.use('/api', draftsRoutes)
app.use('/api', skillsRoutes)

// 404 处理
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// 全局错误处理
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

const server = createServer(app)

setupWebSocket(server)

server.listen(PORT, () => {
  console.log(`CodeTown server running on http://localhost:${PORT}`)
})

export { server }
