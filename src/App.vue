<template>
  <a-layout class="admin-layout">
    <a-layout-header class="header">
      <div class="header-left">
        <div class="logo">
          <img src="/vite.svg" alt="logo" />
          天云聚合运营管理中心
        </div>
        <div class="quick-access">
          <div class="access-section">
            <h4>最近访问</h4>
            <a-space>
              <a-button type="link" @click="handleMenuClick({ key: 'data-management' })">数据管理平台</a-button>
              <a-button type="link" @click="handleMenuClick({ key: 'agent-management' })">Agent管理平台</a-button>
              <a-button type="link" @click="handleMenuClick({ key: 'knowledge-management' })">知识管理平台</a-button>
              <a-button type="link" @click="handleMenuClick({ key: 'users' })">用户管理</a-button>
              <a-button type="link" @click="handleMenuClick({ key: 'help-center' })">帮助中心</a-button>
            </a-space>
          </div>
        </div>
      </div>
      <div class="header-right">
        <a-space>
          <a-dropdown>
            <a-button>
              <template #icon><UserOutlined /></template>
              管理员
            </a-button>
            <template #overlay>
              <a-menu>
                <a-menu-item key="profile">个人信息</a-menu-item>
                <a-menu-item key="switch-role">切换身份</a-menu-item>
                <a-menu-item key="logout">退出登录</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </a-space>
      </div>
    </a-layout-header>

    <a-layout>
      <a-layout-sider width="256" class="sider">
        <a-menu
          mode="inline"
          :selectedKeys="selectedKey"
          @click="handleMenuClick"
          style="height: 100%"
        >
          <a-menu-item key="dashboard">
            <template #icon><DashboardOutlined /></template>
            仪表盘
          </a-menu-item>
          <a-menu-item key="agent-management">
            <template #icon><RobotOutlined /></template>
            Agent管理平台
          </a-menu-item>
          <a-menu-item key="data-management">
            <template #icon><DatabaseOutlined /></template>
            数据管理平台
          </a-menu-item>
          <a-menu-item key="knowledge-management">
            <template #icon><BookOutlined /></template>
            知识管理平台
          </a-menu-item>
          <a-menu-item key="users">
            <template #icon><UserOutlined /></template>
            用户管理
          </a-menu-item>
          <a-menu-item key="verification">
            <template #icon><SafetyCertificateOutlined /></template>
            认证管理
          </a-menu-item>
          <a-menu-item key="subscriptions">
            <template #icon><AppstoreOutlined /></template>
            订阅计划管理
          </a-menu-item>
          <a-menu-item key="orders">
            <template #icon><ShoppingOutlined /></template>
            订单管理
          </a-menu-item>
          <a-menu-item key="help-center">
            <template #icon><QuestionCircleOutlined /></template>
            帮助中心
          </a-menu-item>
          <a-menu-item key="roles">
            <template #icon><KeyOutlined /></template>
            角色与权限管理
          </a-menu-item>
        </a-menu>
      </a-layout-sider>

      <a-layout-content class="content">
        <router-view></router-view>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style lang="less" scoped>
.admin-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    height: 48px;
    min-height: 48px;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
  
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
      max-width: calc(100% - 200px);
      overflow: hidden;
  
      .logo {
        display: flex;
        align-items: center;
        font-size: 16px;
        font-weight: 500;
        flex-shrink: 0;
  
        img {
          height: 24px;
          margin-right: 8px;
        }
      }
  
      .quick-access {
        display: flex;
        align-items: center;
        padding: 0 16px;
        border-left: 1px solid #f0f0f0;
        flex: 1;
        min-width: 0;
  
        .access-section {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          
          h4 {
            margin: 0;
            font-size: 13px;
            color: #666;
            font-weight: 500;
            white-space: nowrap;
          }
  
          .ant-space {
            flex-wrap: wrap;
            gap: 4px !important;
            overflow: hidden;
          }
  
          .ant-btn-link {
            padding: 2px 8px;
            height: 24px;
            line-height: 20px;
            border-radius: 4px;
            transition: all 0.3s;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 160px;
            font-size: 13px;
            
            &:hover {
              background: #f5f5f5;
            }
          }
        }
      }
    }
  }

  :deep(.ant-layout) {
    margin-top: 48px;
    height: calc(100vh - 48px);
  }

  .sider {
    background: #fff;
    border-right: 1px solid #f0f0f0;
    height: 100%;
    position: fixed;
    left: 0;
    overflow: auto;
  }

  :deep(.ant-layout-has-sider) {
    padding-left: 256px;
  }

  .content {
    padding: 24px;
    background: #f5f5f5;
    min-height: 100%;
    overflow-y: auto;
  }
}
</style>

<script lang="ts" setup>
import { ref } from 'vue'
import {
  UserOutlined,
  DashboardOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  AppstoreOutlined,
  ShoppingOutlined,
  KeyOutlined,
  DatabaseOutlined,
  BookOutlined,
  RobotOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons-vue'

import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const selectedKey = ref([route.path.substring(1) || 'dashboard'])

const handleMenuClick = ({ key }: { key: string }) => {
  router.push(`/${key}`)
  selectedKey.value = [key]
}
</script>
