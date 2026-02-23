<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')

function getUsers() {
  try { return JSON.parse(localStorage.getItem('users') || '[]') } catch (e) { return [] }
}

function submit(e) {
  e.preventDefault()
  error.value = ''
  const users = getUsers()
  const user = users.find(u => u.email === email.value && u.password === password.value)
  if (!user) { error.value = 'Invalid email or password'; return }
  localStorage.setItem('currentUser', JSON.stringify({ name: user.name, email: user.email }))
  window.dispatchEvent(new Event('auth-changed'))
  router.push('/calculator')
}
</script>

<template>
  <div class="auth">
    <h2>Login</h2>
    <form @submit.prevent="submit">
      <label>Email</label>
      <input v-model="email" type="email" required />
      <label>Password</label>
      <input v-model="password" type="password" required />
      <button type="submit">Login</button>
    </form>
    <p v-if="error" style="color:red">{{ error }}</p>
  </div>
</template>

<style scoped>
.auth { max-width: 420px; margin: 2rem auto; }
label { display:block; margin-top: .5rem }
input { width:100%; padding:.5rem; margin-top:.25rem }
button { margin-top:1rem; padding:.5rem 1rem }
</style>
