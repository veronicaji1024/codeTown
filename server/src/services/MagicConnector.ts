import { createHash } from 'node:crypto'
import type { MagicCategory } from '@codetown/shared'

// ===== 关键词白名单（主分类器，无需 Claude 调用）=====
const KEYWORD_MAP: Record<MagicCategory, string[]> = {
  weather: ['天气', '气温', '温度', '下雨', '晴', '阴', '风力', '湿度', '预报', '气候'],
  translate: ['翻译', '翻成', '变成英文', '变成日文', '变成韩文', '转换语言', '用英语说'],
  news: ['新闻', '头条', '资讯', '热点', '最新消息', '报道', '新闻搜索'],
  unsupported: [],
}

// ===== 主分类函数（关键词优先，不消耗 Claude Token）=====
export function classifyByKeyword(description: string): MagicCategory {
  for (const [category, keywords] of Object.entries(KEYWORD_MAP)) {
    if (category === 'unsupported') continue
    if (keywords.some((kw) => description.includes(kw))) {
      return category as MagicCategory
    }
  }
  return 'unsupported'
}

// ===== 城市名提取（天气用）=====
function extractCity(description: string): string {
  const match = description.match(/^(.{2,6}?)(?:今天|明天|后天|这周|本周|的天气|天气)/)
  return match?.[1]?.trim() || '北京'
}

// ===== 目标语言提取（翻译用）=====
function extractTargetLang(description: string): string {
  if (/英文|英语/.test(description)) return 'en'
  if (/日文|日语/.test(description)) return 'jp'
  if (/韩文|韩语/.test(description)) return 'kor'
  if (/法文|法语/.test(description)) return 'fra'
  if (/德文|德语/.test(description)) return 'de'
  return 'en'
}

// ===== 新闻频道提取 =====
function extractNewsType(description: string): string {
  if (/科技|技术/.test(description)) return 'keji'
  if (/体育|运动|足球|篮球/.test(description)) return 'tiyu'
  if (/财经|经济|股市/.test(description)) return 'caijing'
  if (/娱乐|明星|电影/.test(description)) return 'yule'
  return 'top'
}

// ===== 统一调用入口 =====
export interface MagicResult {
  category: MagicCategory
  data: unknown
  summary?: string
}

export async function classifyAndCall(description: string): Promise<MagicResult> {
  const category = classifyByKeyword(description)

  if (category === 'unsupported') {
    return { category, data: null, summary: '暂时不支持这种连接' }
  }

  if (category === 'weather') {
    const cityName = extractCity(description)
    // Step 1: 城市名 → adcode
    const geoResp = await fetch(
      `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(cityName)}&key=${process.env.AMAP_KEY}`
    ).then((r) => r.json())
    const adcode = geoResp.geocodes?.[0]?.adcode
    if (!adcode) return { category, data: null, summary: `找不到城市：${cityName}` }
    // Step 2: adcode → 天气
    const weatherResp = await fetch(
      `https://restapi.amap.com/v3/weather/weatherInfo?city=${adcode}&extensions=all&key=${process.env.AMAP_KEY}`
    ).then((r) => r.json())
    return { category, data: weatherResp.forecasts?.[0], summary: `${cityName}天气数据已获取` }
  }

  if (category === 'translate') {
    const textToTranslate = description.replace(/翻译[成到]?|用.*语说/g, '').trim() || description
    const targetLang = extractTargetLang(description)
    const salt = Date.now().toString()
    const sign = createHash('md5')
      .update(
        `${process.env.BAIDU_TRANSLATE_APPID}${textToTranslate}${salt}${process.env.BAIDU_TRANSLATE_SECRET}`
      )
      .digest('hex')
    const body = new URLSearchParams({
      q: textToTranslate,
      from: 'auto',
      to: targetLang,
      appid: process.env.BAIDU_TRANSLATE_APPID!,
      salt,
      sign,
    })
    const transResp = await fetch('https://fanyi-api.baidu.com/api/trans/vip/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    }).then((r) => r.json())
    return { category, data: transResp.trans_result?.[0], summary: '翻译结果已获取' }
  }

  if (category === 'news') {
    const newsType = extractNewsType(description)
    const newsResp = await fetch(
      `https://v.juhe.cn/toutiao/index?type=${newsType}&key=${process.env.JUHE_NEWS_KEY}`
    ).then((r) => r.json())
    // 仅返回标题（不返回原文，避免版权问题）
    const headlines = newsResp.result?.data
      ?.slice(0, 10)
      .map((item: { title: string; uniquekey: string }) => ({
        title: item.title,
        id: item.uniquekey,
      }))
    return {
      category,
      data: headlines,
      summary: '新闻头条标题已获取，Agent 需基于标题重新表述内容',
    }
  }

  return { category: 'unsupported', data: null }
}
