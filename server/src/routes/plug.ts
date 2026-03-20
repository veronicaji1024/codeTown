import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { classifyAndCall } from '../services/MagicConnector'

const router = Router()

// POST /api/plug/unsplash — 图片素材搜索代理
router.post('/plug/unsplash', requireAuth, async (req, res) => {
  try {
    const { keyword } = req.body
    if (!keyword || typeof keyword !== 'string') {
      res.status(400).json({ error: 'keyword is required' })
      return
    }

    const resp = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&per_page=5`,
      {
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
        },
      }
    )

    if (!resp.ok) {
      res.status(502).json({ error: 'Unsplash API error' })
      return
    }

    const data = await resp.json()
    const urls = data.results?.map(
      (r: { urls: { regular: string } }) => r.urls.regular
    ) as string[]

    res.json({ urls: urls || [] })
  } catch (err) {
    console.error('Unsplash proxy error:', err)
    res.status(500).json({ error: 'Unsplash proxy failed' })
  }
})

// POST /api/plug/mapbox — 地图代理
router.post('/plug/mapbox', requireAuth, async (req, res) => {
  try {
    const { location } = req.body
    if (!location || typeof location !== 'string') {
      res.status(400).json({ error: 'location is required' })
      return
    }

    const token = process.env.MAPBOX_ACCESS_TOKEN
    // Step 1: Geocoding
    const geoResp = await fetch(
      `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(location)}&access_token=${token}`
    )

    if (!geoResp.ok) {
      res.status(502).json({ error: 'Mapbox geocoding error' })
      return
    }

    const geoData = await geoResp.json()
    const coords = geoData.features?.[0]?.geometry?.coordinates
    if (!coords) {
      res.status(404).json({ error: `Location not found: ${location}` })
      return
    }

    const [lon, lat] = coords as [number, number]

    // Step 2: 拼接静态地图图片 URL
    const imageUrl =
      `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
      `pin-s+3385ff(${lon},${lat})/${lon},${lat},14/600x400@2x?access_token=${token}`

    res.json({ imageUrl, lat, lon })
  } catch (err) {
    console.error('Mapbox proxy error:', err)
    res.status(500).json({ error: 'Mapbox proxy failed' })
  }
})

// POST /api/plug/magic — 魔法连接代理
router.post('/plug/magic', requireAuth, async (req, res) => {
  try {
    const { description } = req.body
    if (!description || typeof description !== 'string') {
      res.status(400).json({ error: 'description is required' })
      return
    }

    const result = await classifyAndCall(description)
    res.json(result)
  } catch (err) {
    console.error('Magic connector error:', err)
    res.status(500).json({ error: 'Magic connector failed' })
  }
})

export default router
