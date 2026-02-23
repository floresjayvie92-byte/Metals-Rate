<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')

function getUsers() {
  try { return JSON.parse(localStorage.getItem('users') || '[]') } catch (e) { return [] }
}
function saveUsers(users) { localStorage.setItem('users', JSON.stringify(users)) }

function submit(e) {
  e.preventDefault()
  error.value = ''
  const users = getUsers()
  if (users.find(u => u.email === email.value)) { error.value = 'Email already registered'; return }
  const newUser = { name: name.value, email: email.value, password: password.value }
  users.push(newUser)
  saveUsers(users)
  localStorage.setItem('currentUser', JSON.stringify({ name: newUser.name, email: newUser.email }))
  window.dispatchEvent(new Event('auth-changed'))
  router.push('/calculator')
}
</script>

<template>
  <div class="auth">
    <h2>Register</h2>
    <form @submit.prevent="submit">
      <label>Name</label>
      <input v-model="name" type="text" required />
      <label>Email</label>
      <input v-model="email" type="email" required />
      <label>Password</label>
      <input v-model="password" type="password" required />
      <button type="submit">Register</button>
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
