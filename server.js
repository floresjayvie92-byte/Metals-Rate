const express = require('express')
const cors = require('cors')

// Use native fetch if available (Node 18+), otherwise try to require node-fetch
let fetchFn = global.fetch
if (!fetchFn) {
  try { fetchFn = require('node-fetch') } catch (e) { /* will error later if no fetch */ }
}

const app = express()
app.use(cors())

async function fetchJson(url) {
  if (!fetchFn) throw new Error('No fetch available on server. Install node-fetch.')
  const r = await fetchFn(url)
  if (!r.ok) throw new Error(`Fetch ${url} failed: ${r.status}`)
  return r.json()
}

app.get('/api/price', async (req, res) => {
  try {
    // try goldprice.org first
    try {
      const d = await fetchJson('https://data-asg.goldprice.org/dbXRates/USD')
      if (d && Array.isArray(d.items) && d.items[0]) {
        const it = d.items[0]
        const gold = Number(it.xauPrice) || 0
        const silver = Number(it.xagPrice) || 0
        if (gold || silver) return res.json({ gold, silver })
      }
    } catch (e) {
      // continue to next
    }

    // try metals.live per-metal
    try {
      const [dg, ds] = await Promise.all([
        fetchJson('https://api.metals.live/v1/spot/gold'),
        fetchJson('https://api.metals.live/v1/spot/silver')
      ])
      let gold = 0, silver = 0
      if (Array.isArray(dg) && dg[0]) gold = dg[0].price || dg[0].amount || gold
      if (Array.isArray(ds) && ds[0]) silver = ds[0].price || ds[0].amount || silver
      if (gold || silver) return res.json({ gold, silver })
    } catch (e) {
      // continue
    }

    // last try: metals.live bulk
    try {
      const bulk = await fetchJson('https://api.metals.live/v1/spot')
      let gold = 0, silver = 0
      if (Array.isArray(bulk)) {
        bulk.forEach(item => {
          const code = (item.code || item.symbol || '').toString().toLowerCase()
          const price = item.price || item.amount || item.value || 0
          if (code.includes('xau') || code.includes('gold')) gold = gold || price
          if (code.includes('xag') || code.includes('silver')) silver = silver || price
        })
      }
      if (gold || silver) return res.json({ gold, silver })
    } catch (e) {
      // continue
    }

    return res.status(502).json({ error: 'No price source available' })
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) })
  }
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Proxy server listening on http://localhost:${PORT}`))
