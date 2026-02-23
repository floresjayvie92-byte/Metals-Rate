export default async function fetchMarketPrice() {
  // Try local proxy first to avoid CORS issues (run server.js)
  const proxyUrl = 'http://localhost:4000/api/price'
  try {
    const rp = await fetch(proxyUrl)
    if (rp.ok) {
      const d = await rp.json()
      if (d && (d.gold || d.silver)) return { gold: d.gold || 0, silver: d.silver || 0 }
    }
  } catch (e) {
    // fallthrough to direct attempts
  }

  // direct browser attempts (may fail due to CORS)
  const attempts = []

  // 1) goldprice.org
  attempts.push(async () => {
    const r = await fetch('https://data-asg.goldprice.org/dbXRates/USD')
    if (!r.ok) throw new Error('goldprice API failed')
    const d = await r.json()
    if (d && Array.isArray(d.items) && d.items[0]) {
      const it = d.items[0]
      const gold = Number(it.xauPrice) || 0
      const silver = Number(it.xagPrice) || 0
      if (gold || silver) return { gold, silver }
    }
    throw new Error('goldprice no data')
  })

  // 2) metals.live per-metal
  attempts.push(async () => {
    const [rg, rs] = await Promise.all([
      fetch('https://api.metals.live/v1/spot/gold'),
      fetch('https://api.metals.live/v1/spot/silver')
    ])
    let gold = 0, silver = 0
    if (rg.ok) {
      const dg = await rg.json()
      if (Array.isArray(dg) && dg[0]) gold = dg[0].price || dg[0].amount || gold
    }
    if (rs.ok) {
      const ds = await rs.json()
      if (Array.isArray(ds) && ds[0]) silver = ds[0].price || ds[0].amount || silver
    }
    if (gold || silver) return { gold: gold || 0, silver: silver || 0 }
    throw new Error('metals.live per-metal no data')
  })

  // 3) metals.live bulk
  attempts.push(async () => {
    const res = await fetch('https://api.metals.live/v1/spot')
    if (!res.ok) throw new Error('metals.live failed')
    const data = await res.json()
    let gold = 0, silver = 0
    if (Array.isArray(data)) {
      data.forEach(item => {
        const code = (item.code || item.symbol || '').toString().toLowerCase()
        const price = item.price || item.amount || item.value || 0
        if (code.includes('xau') || code.includes('gold')) gold = gold || price
        if (code.includes('xag') || code.includes('silver')) silver = silver || price
      })
    }
    if (gold || silver) return { gold: gold || 0, silver: silver || 0 }
    throw new Error('metals.live no data')
  })

  const errors = []
  for (const attempt of attempts) {
    try {
      const res = await attempt()
      if ((res.gold && res.gold > 0) || (res.silver && res.silver > 0)) return res
    } catch (e) {
      errors.push(e.message || String(e))
    }
  }

  throw new Error('All price endpoints failed: ' + errors.join(' | '))
}
