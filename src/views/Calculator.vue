<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import fetchMarketPrice from '../utils/fetchMarketPrice'

const metal = ref('gold')
const marketPriceOunce = ref(0)
const loadingPrice = ref(false)
const priceError = ref('')
const unit = ref('ounce')
const weight = ref(1)
const karat = ref(24)
const tax = ref(0)

const purity = computed(() => (metal.value === 'gold' ? karat.value / 24 : 1))
const OUNCE_TO_GRAM = 31.1034768

const pricePerGram = computed(() => marketPriceOunce.value ? marketPriceOunce.value / OUNCE_TO_GRAM : 0)

const pricePerSelectedUnit = computed(() => {
  if (!pricePerGram.value) return 0
  if (unit.value === 'gram') return pricePerGram.value
  if (unit.value === 'kg') return pricePerGram.value * 1000
  return pricePerGram.value * OUNCE_TO_GRAM
})

const basePriceForWeight = computed(() => {
  let grams = 0
  if (unit.value === 'gram') grams = Number(weight.value) || 0
  else if (unit.value === 'kg') grams = (Number(weight.value) || 0) * 1000
  else grams = (Number(weight.value) || 0) * OUNCE_TO_GRAM
  return pricePerGram.value * grams
})

// async debounced calculation
const calculatedPrice = ref(0)
const calculating = ref(false)
let timer = null
watch([basePriceForWeight, purity, tax], () => {
  calculating.value = true
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    const discounted = basePriceForWeight.value * purity.value * (1 - tax.value / 100)
    calculatedPrice.value = Math.max(discounted, 0)
    calculating.value = false
  }, 300)
})

async function updateMarketPrice() {
  loadingPrice.value = true
  priceError.value = ''
  try {
    const prices = await fetchMarketPrice()
    marketPriceOunce.value = metal.value === 'gold' ? prices.gold : prices.silver
  } catch (e) {
    priceError.value = e && e.message ? `Failed to fetch market price: ${e.message}` : 'Failed to fetch market price'
    marketPriceOunce.value = 0
  } finally {
    loadingPrice.value = false
  }
}

onMounted(() => updateMarketPrice())
watch(metal, () => updateMarketPrice())

function formatMoney(value, decimals = 2) {
  const n = Number(value)
  if (!isFinite(n)) return '$0.00'
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}
</script>

<template>
  <div class="calculator">
    <h2>Gold & Silver Calculator</h2>
    <div class="row">
      <label>Metal</label>
      <select v-model="metal">
        <option value="gold">Gold</option>
        <option value="silver">Silver</option>
      </select>
    </div>

    <div class="row">
      <label>Live market price</label>
      <div style="display:flex;gap:.5rem;align-items:center">
        <div>
          <strong v-if="!loadingPrice">{{ formatMoney(marketPriceOunce) }} per ounce</strong>
          <span v-else>Loading...</span>
          <div class="small-muted">(~{{ formatMoney(pricePerSelectedUnit, 4) }} per selected unit)</div>
        </div>
        <button @click="updateMarketPrice">Refresh</button>
      </div>
      <p v-if="priceError" style="color:red">{{ priceError }}</p>
    </div>

    <div class="row">
      <label>Unit</label>
      <select v-model="unit">
        <option value="ounce">Ounce</option>
        <option value="gram">Gram</option>
        <option value="kg">Kilogram</option>
      </select>
    </div>

    <div class="row">
      <label>Weight</label>
      <input type="number" v-model.number="weight" step="0.001" />
    </div>

    <div class="row" v-if="metal==='gold'">
      <label>Karat</label>
      <select v-model.number="karat">
        <option :value="24">24K</option>
        <option :value="22">22K</option>
        <option :value="18">18K</option>
        <option :value="14">14K</option>
        <option :value="10">10K</option>
      </select>
    </div>

    <div class="row">
      <label>Tax (%) (reduction)</label>
      <input type="number" v-model.number="tax" step="0.1" />
    </div>

    <hr />
    <div>
      <p>Base price for weight: <strong>{{ formatMoney(basePriceForWeight) }}</strong></p>
      <p>Purity factor: <strong>{{ purity.toFixed(4) }}</strong></p>
      <p>Final price (after tax reduction): <strong>{{ calculating ? 'Calculating...' : formatMoney(calculatedPrice) }}</strong></p>
    </div>
  </div>
</template>

<style scoped>
.calculator { max-width:600px; margin:2rem auto }
.row { margin-bottom: .75rem }
label { display:block; margin-bottom:.25rem }
input, select { width:100%; padding:.5rem }
</style>
