import React, { useEffect, useMemo, useState, useRef } from 'react'
import fetchMarketPrice from '../utils/fetchMarketPrice'

const OUNCE_TO_GRAM = 31.1034768

export default function Calculator() {
  const [metal, setMetal] = useState('gold')
  const [marketPriceOunce, setMarketPriceOunce] = useState(0)
  const [loadingPrice, setLoadingPrice] = useState(false)
  const [priceError, setPriceError] = useState('')
  const [unit, setUnit] = useState('ounce')
  const [weight, setWeight] = useState(1)
  const [karat, setKarat] = useState(24)
  const [tax, setTax] = useState(0)

  const purity = useMemo(() => (metal === 'gold' ? karat / 24 : 1), [metal, karat])

  const pricePerGram = useMemo(() => {
    if (!marketPriceOunce) return 0
    return marketPriceOunce / OUNCE_TO_GRAM
  }, [marketPriceOunce])

  const pricePerSelectedUnit = useMemo(() => {
    if (!pricePerGram) return 0
    if (unit === 'gram') return pricePerGram
    if (unit === 'kg') return pricePerGram * 1000
    return pricePerGram * OUNCE_TO_GRAM
  }, [pricePerGram, unit])

  const basePriceForWeight = useMemo(() => {
    let grams = 0
    if (unit === 'gram') grams = Number(weight) || 0
    else if (unit === 'kg') grams = (Number(weight) || 0) * 1000
    else grams = (Number(weight) || 0) * OUNCE_TO_GRAM
    return pricePerGram * grams
  }, [unit, weight, pricePerGram])

  // We'll compute final price asynchronously (debounced) so the UI behaves like "AJAX" while typing.
  const [calculatedPrice, setCalculatedPrice] = useState(() => {
    const d = basePriceForWeight * purity * (1 - tax / 100)
    return Math.max(d, 0)
  })
  const [calculating, setCalculating] = useState(false)
  const calcTimer = useRef(null)

  useEffect(() => {
    // Debounce calculation: wait 300ms after the last change
    if (calcTimer.current) clearTimeout(calcTimer.current)
    setCalculating(true)
    calcTimer.current = setTimeout(() => {
      (async () => {
        // simulate async/remote calculation (fast)
        const discounted = basePriceForWeight * purity * (1 - tax / 100)
        const value = Math.max(discounted, 0)
        setCalculatedPrice(value)
        setCalculating(false)
      })()
    }, 300)
    return () => { if (calcTimer.current) clearTimeout(calcTimer.current) }
  }, [basePriceForWeight, purity, tax])

  async function updateMarketPrice() {
    setLoadingPrice(true)
    setPriceError('')
    try {
      const prices = await fetchMarketPrice()
      setMarketPriceOunce(metal === 'gold' ? prices.gold : prices.silver)
    } catch (e) {
      // show underlying error message for easier debugging (CORS/network etc.)
      setPriceError(e && e.message ? `Failed to fetch market price: ${e.message}` : 'Failed to fetch market price')
      setMarketPriceOunce(0)
    } finally {
      setLoadingPrice(false)
    }
  }

  useEffect(() => { updateMarketPrice() }, [metal])

  function formatMoney(value, decimals = 2) {
    const n = Number(value)
    if (!isFinite(n)) return '$0.00'
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  }

  return (
    <div className="calculator" style={{ maxWidth: 720, margin: '0 auto' }}>
      <h2>Gold & Silver Calculator</h2>

      <div style={{ marginBottom: 12 }}>
        <label>Metal</label>
        <select value={metal} onChange={e => setMetal(e.target.value)}>
          <option value="gold">Gold</option>
          <option value="silver">Silver</option>
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>Live market price</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div>
            {loadingPrice ? <div>Loading...</div> : <div><strong>{formatMoney(marketPriceOunce)} per ounce</strong>
              <div style={{ fontSize: 13, color: '#666' }}>(~{formatMoney(pricePerSelectedUnit, 4)} per selected unit)</div>
            </div>}
          </div>
          <button onClick={updateMarketPrice}>Refresh</button>
        </div>
        {priceError ? <p style={{ color: 'red' }}>{priceError}</p> : null}
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>Unit</label>
        <select value={unit} onChange={e => setUnit(e.target.value)}>
          <option value="ounce">Ounce</option>
          <option value="gram">Gram</option>
          <option value="kg">Kilogram</option>
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>Weight</label>
        <input type="number" step="0.001" value={weight} onChange={e => setWeight(e.target.value)} />
      </div>

      {metal === 'gold' && (
        <div style={{ marginBottom: 12 }}>
          <label>Karat</label>
          <select value={karat} onChange={e => setKarat(Number(e.target.value))}>
            <option value={24}>24K</option>
            <option value={22}>22K</option>
            <option value={18}>18K</option>
            <option value={14}>14K</option>
            <option value={10}>10K</option>
          </select>
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <label>Tax (%) (reduction)</label>
        <input type="number" step="0.1" value={tax} onChange={e => setTax(Number(e.target.value))} />
      </div>

      <hr />
      <div>
        <p>Base price for weight: <strong>{formatMoney(basePriceForWeight)}</strong></p>
        <p>Purity factor: <strong>{purity.toFixed(4)}</strong></p>
        <p>Final price (after tax reduction): <strong>{calculating ? 'Calculating...' : formatMoney(calculatedPrice)}</strong></p>
      </div>
    </div>
  )
}
