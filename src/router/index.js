import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Calculator from '../views/Calculator.vue'

const routes = [
  { path: '/', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { path: '/calculator', name: 'Calculator', component: Calculator }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, from, next) => {
  const publicNames = ['Login', 'Register']
  const loggedIn = !!localStorage.getItem('currentUser')
  if (!publicNames.includes(to.name) && !loggedIn) return next({ name: 'Login' })
  next()
})

export default router
