import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/views/Dashboard.vue')
    },
    {
      path: '/users',
      name: 'Users',
      component: () => import('@/views/Users.vue')
    },
    {
      path: '/verification',
      name: 'Verification',
      component: () => import('@/views/Verification.vue')
    },
    {
      path: '/subscriptions',
      name: 'Subscriptions',
      component: () => import('@/views/Subscriptions.vue')
    },
    {
      path: '/orders',
      name: 'Orders',
      component: () => import('@/views/Orders.vue')
    },
    {
      path: '/data-management',
      name: 'DataManagement',
      component: () => import('@/views/DataManagement.vue')
    },
    {
      path: '/knowledge-management',
      name: 'KnowledgeManagement',
      component: () => import('@/views/KnowledgeManagement.vue')
    },
    {
      path: '/agent-management',
      name: 'AgentManagement',
      component: () => import('@/views/AgentManagement.vue')
    },
    {
      path: '/roles',
      name: 'Roles',
      component: () => import('@/views/Roles.vue')
    },
    {
      path: '/help-center',
      name: 'HelpCenter',
      component: () => import('@/views/HelpCenter.vue')
    }
  ]
})

export default router