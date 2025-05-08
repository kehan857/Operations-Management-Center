import { createRouter, createWebHistory } from 'vue-router'
import KnowledgeManagement from '../views/KnowledgeManagement.vue'
import HelpCenter from '../views/HelpCenter.vue'

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
      component: () => import('../views/Dashboard.vue')
    },
    {
      path: '/users',
      name: 'Users',
      component: () => import('../views/Users.vue')
    },
    {
      path: '/verification',
      name: 'Verification',
      component: () => import('../views/Verification.vue')
    },
    {
      path: '/subscriptions',
      name: 'Subscriptions',
      component: () => import('../views/Subscriptions.vue')
    },
    {
      path: '/orders',
      name: 'Orders',
      component: () => import('../views/Orders.vue')
    },
    {
      path: '/data-management',
      name: 'DataManagement',
      component: () => import('../views/DataManagement.vue')
    },
    {
      path: '/knowledge-management',
      name: 'KnowledgeManagement',
      component: KnowledgeManagement
    },
    {
      path: '/agent-management',
      name: 'AgentManagement',
      component: () => import('../views/AgentManagement.vue')
    },
    {
      path: '/roles',
      name: 'Roles',
      component: () => import('../views/Roles.vue')
    },
    {
      path: '/help-center',
      name: 'HelpCenter',
      component: HelpCenter
    }
  ]
})

export default router