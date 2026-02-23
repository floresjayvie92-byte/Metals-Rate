// Vercel Serverless function to proxy metal prices and avoid CORS.
// Deploying this file to Vercel will expose /api/price.

module.exports = async (req, res) => {
  const errors = []
  try {
    console.log('api/price invoked')
    // Try goldprice.org first
    try {
      const r = await fetch('https://data-asg.goldprice.org/dbXRates/USD')
      if (r.ok) {
        const d = await r.json()
        if (d && Array.isArray(d.items) && d.items[0]) {
          const it = d.items[0]
          const gold = Number(it.xauPrice) || 0
          const silver = Number(it.xagPrice) || 0
          if (gold || silver) return res.status(200).json({ gold, silver })
        }
      } else {
        const t = await r.text().catch(() => '')
        errors.push(`goldprice.org ${r.status}: ${t}`)
      }
    } catch (e) {
      console.error('goldprice fetch error', e)
      errors.push(String(e))
    }

    // Try metals.live per-metal
    try {
      const [rg, rs] = await Promise.all([
        fetch('https://api.metals.live/v1/spot/gold'),
        fetch('https://api.metals.live/v1/spot/silver')
      ])
      let gold = 0, silver = 0
      if (rg.ok) {
        const dg = await rg.json()
        if (Array.isArray(dg) && dg[0]) gold = dg[0].price || dg[0].amount || gold
      } else {
        errors.push(`metals.live gold ${rg.status}`)
      }
      if (rs.ok) {
        const ds = await rs.json()
        if (Array.isArray(ds) && ds[0]) silver = ds[0].price || ds[0].amount || silver
      } else {
        errors.push(`metals.live silver ${rs.status}`)
      }
      if (gold || silver) return res.status(200).json({ gold, silver })
    } catch (e) {
      console.error('metals.live per-metal error', e)
      errors.push(String(e))
    }

    // Try metals.live bulk
    try {
      const rb = await fetch('https://api.metals.live/v1/spot')
      if (rb.ok) {
        const bulk = await rb.json()
        let gold = 0, silver = 0
        if (Array.isArray(bulk)) {
          bulk.forEach(item => {
            const code = (item.code || item.symbol || '').toString().toLowerCase()
            const price = item.price || item.amount || item.value || 0
            if (code.includes('xau') || code.includes('gold')) gold = gold || price
            if (code.includes('xag') || code.includes('silver')) silver = silver || price
          })
        }
        if (gold || silver) return res.status(200).json({ gold, silver })
      } else {
        errors.push(`metals.live bulk ${rb.status}`)
      }
    } catch (e) {
      console.error('metals.live bulk error', e)
      errors.push(String(e))
    }

    console.error('All attempts failed', errors)
    return res.status(502).json({ error: 'No price source available', details: errors })
  } catch (err) {
    console.error('api/price unexpected error', err)
    return res.status(500).json({ error: err.message || String(err), details: errors })
  }
}
