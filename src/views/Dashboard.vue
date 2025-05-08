<template>
  <div class="dashboard">
    <h2 class="dashboard-title">天云聚合运营管理中心</h2>
    <p class="dashboard-description">欢迎来到天云聚合服务平台运营管理中心，您可以在这里管理用户、订阅、数据和智能体等资源。</p>
    
    <!-- 核心指标卡片组 - 简化版 -->
    <a-row :gutter="[16, 16]">
      <a-col :xs="12" :sm="8" :md="8" :lg="6" :xl="4" v-for="(card, index) in metricCards" :key="index">
        <a-card hoverable class="metric-card" @click="card.action">
          <div class="metric-content">
            <div class="metric-icon">
              <component :is="card.icon" />
            </div>
            <div class="metric-info">
              <div class="metric-title">{{ card.title }}</div>
              <div class="metric-value">{{ card.value }}</div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 简化待办事项列表，去掉标签，添加具体信息 -->
    <a-card title="待处理事项" class="todo-card" :bordered="false">
      <a-list :data-source="todoItems" size="small">
        <template #renderItem="{ item }">
          <a-list-item class="todo-item" @click="handleTodoItem(item)">
            <span class="todo-text">{{ item.content }}</span>
          </a-list-item>
        </template>
      </a-list>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  TeamOutlined,
  SafetyCertificateOutlined,
  ShoppingOutlined,
  RiseOutlined,
  RobotOutlined,
  BookOutlined
} from '@ant-design/icons-vue'

const router = useRouter()

// 指标卡片数据 - 简化版
const metricCards = [
  {
    title: '总用户数',
    value: '1,234',
    icon: TeamOutlined,
    action: () => router.push('/users')
  },
  {
    title: '待审核企业',
    value: '56',
    icon: SafetyCertificateOutlined,
    action: () => router.push('/verification')
  },
  {
    title: '本月订单数',
    value: '89',
    icon: ShoppingOutlined,
    action: () => router.push('/orders')
  },
  {
    title: '月收入(万元)',
    value: '23.5',
    icon: RiseOutlined,
    action: () => router.push('/orders')
  },
  {
    title: '活跃Agent数',
    value: '42',
    icon: RobotOutlined,
    action: () => router.push('/agent-management')
  },
  {
    title: '知识库文档数',
    value: '245',
    icon: BookOutlined,
    action: () => router.push('/knowledge-management')
  }
]

// 待办事项数据 - 只保留企业认证和订单处理，添加具体信息
const todoItems = [
  {
    id: 1,
    content: '企业认证申请待审核：未来科技有限公司',
    route: '/verification?id=VER20240501001'
  },
  {
    id: 2,
    content: '新订单待处理：ORD20240501003',
    route: '/orders?id=ORD20240501003'
  }
]

// 修改待办项类型接口
interface TodoItem {
  id: number;
  content: string;
  route: string;
}

// 处理待办事项点击
function handleTodoItem(item: TodoItem) {
  router.push(item.route)
}
</script>

<style scoped>
.dashboard {
  padding: 16px;
}

.dashboard-title {
  margin-bottom: 8px;
  color: #1890ff;
}

.dashboard-description {
  margin-bottom: 24px;
  color: #666;
}

.metric-card {
  margin-bottom: 16px;
  cursor: pointer;
}

.metric-content {
  display: flex;
  align-items: center;
}

.metric-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: #e6f7ff;
  color: #1890ff;
  font-size: 24px;
  margin-right: 12px;
}

.metric-info {
  flex: 1;
}

.metric-title {
  font-size: 14px;
  color: #666;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.todo-card {
  margin-top: 16px;
}

.todo-item {
  cursor: pointer;
  padding: 8px 0;
}

.todo-text {
  color: #333;
}
</style>