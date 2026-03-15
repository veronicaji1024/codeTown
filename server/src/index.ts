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

// TODO Phase 14: buildRoutes, shareRoutes
// app.use('/api', buildRoutes)
// app.use('/api', shareRoutes)

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

// TODO Phase 12: attachWebSocketServer(server)

server.listen(PORT, () => {
  console.log(`CodeTown server running on http://localhost:${PORT}`)
})

export { server }
