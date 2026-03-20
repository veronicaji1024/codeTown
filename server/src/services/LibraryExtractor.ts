import fs from 'node:fs'
import path from 'node:path'
import mammoth from 'mammoth'

export async function extractText(filePath: string, originalName: string): Promise<string> {
  const ext = path.extname(originalName).toLowerCase()

  if (ext === '.txt' || ext === '.md') {
    return fs.promises.readFile(filePath, 'utf-8')
  }

  if (ext === '.doc' || ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath })
    return result.value
  }

  throw new Error(`不支持的文件格式：${ext}`)
}
