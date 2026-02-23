<template>
  <div class="App">
    <nav>
      <template v-if="!user">
        <router-link to="/">Login</router-link>
        <span> | </span>
        <router-link to="/register">Register</router-link>
        <span> | </span>
      </template>
      <template v-if="user">
        <router-link to="/calculator">Calculator</router-link>
      </template>
      <span style="float: right" v-if="user">
        <strong style="margin-right:8px">{{ user.name }}</strong>
        <button @click="logout">Logout</button>
      </span>
    </nav>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const user = ref(null)
onMounted(() => {
  const u = localStorage.getItem('currentUser')
  user.value = u ? JSON.parse(u) : null
  function onAuth() { const uu = localStorage.getItem('currentUser'); user.value = uu ? JSON.parse(uu) : null }
  window.addEventListener('auth-changed', onAuth)
})
function logout() {
  localStorage.removeItem('currentUser')
  window.dispatchEvent(new Event('auth-changed'))
}
</script>
