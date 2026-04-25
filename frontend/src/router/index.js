import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import HomeView from '../views/HomeView.vue'
import CatalogView from '../views/CatalogView.vue'
import ProfileView from '../views/ProfileView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import AdminProductsView from '../views/AdminProductsView.vue'
import { pinia } from '../pinia'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: '', name: 'home', component: HomeView },
        { path: 'catalog', name: 'catalog', component: CatalogView },
        {
          path: 'profile',
          name: 'profile',
          component: ProfileView,
          meta: { requiresAuth: true },
        },
        {
          path: 'login',
          name: 'login',
          component: LoginView,
          meta: { guest: true },
        },
        {
          path: 'register',
          name: 'register',
          component: RegisterView,
          meta: { guest: true },
        },
        {
          path: 'admin',
          name: 'admin',
          component: AdminProductsView,
          meta: { requiresAuth: true },
        },
      ],
    },
  ],
  scrollBehavior(to, from) {
    // Смена только query/hash — остаёмся в SPA, без скачка вверх (каталог, фильтры, пагинация).
    if (from.name != null && to.name === from.name && to.path === from.path) {
      return false
    }
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const auth = useAuthStore(pinia)
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guest && auth.isAuthenticated) {
    return { name: 'home' }
  }
  return true
})

export default router
