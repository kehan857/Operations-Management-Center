<template>
  <div class="users-view">
    <a-page-header
      title="用户管理"
      sub-title="管理平台用户信息、权限和相关订阅服务"
    />

    <a-card>
      <div class="card-content">
        <div class="header-actions">
          <div class="search-wrapper">
            <SearchComponent 
              :search-fields="searchFields"
              :filters="filters"
              :sort-options="sortOptions"
              :quick-filters="quickFilters"
              :enable-export="true"
              @search="handleSearch"
              @filter="handleFilter"
              @export="handleExport"
              @save-filter="handleSaveFilter"
              class="custom-search-component"
          />
          </div>
          <div class="action-wrapper">
            <a-button type="primary" class="add-button" @click="showAddUserModal">
            <template #icon><PlusOutlined /></template>
            添加用户
          </a-button>
          </div>
        </div>
      </div>

      <a-table
        :columns="columns"
        :data-source="users"
        :loading="loading"
        class="users-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === '正常' ? 'green' : 'red'">
              {{ record.status }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a @click="showUserDetail(record)">详情</a>
              <a-divider type="vertical" />
              <a-popconfirm
                :title="`确定${record.status === '正常' ? '禁用' : '启用'}该用户吗？`"
                @confirm="toggleUserStatus(record)"
              >
                <a :style="{ color: record.status === '正常' ? '#ff4d4f' : '#52c41a' }">
                  {{ record.status === '正常' ? '禁用' : '启用' }}
                </a>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 添加用户弹窗 -->
    <a-modal
      v-model:visible="modalVisible"
      title="添加用户"
      @ok="handleModalOk"
    >
      <a-form
        ref="formRef"
        :model="formState"
        :rules="rules"
        layout="vertical"
      >
        <a-form-item label="用户名" name="username">
          <a-input v-model:value="formState.username" />
        </a-form-item>
        <a-form-item label="企业名称" name="company">
          <a-input v-model:value="formState.company" />
        </a-form-item>
        <a-form-item label="联系电话" name="phone">
          <a-input v-model:value="formState.phone" />
        </a-form-item>
        <a-form-item label="邮箱" name="email">
          <a-input v-model:value="formState.email" />
        </a-form-item>
        <a-form-item label="密码" name="password">
          <a-input-password v-model:value="formState.password" />
        </a-form-item>
        <a-form-item label="确认密码" name="confirmPassword">
          <a-input-password v-model:value="formState.confirmPassword" />
        </a-form-item>
      </a-form>
    </a-modal>
    <!-- 用户详情抽屉 -->
    <a-drawer
      v-model:visible="detailDrawerVisible"
      title="用户详情"
      width="800"
      placement="right"
    >
      <template v-if="currentUser">
        <a-descriptions title="基本信息" bordered>
          <a-descriptions-item label="用户ID">{{ currentUser.id }}</a-descriptions-item>
          <a-descriptions-item label="用户名">{{ currentUser.username }}</a-descriptions-item>
          <a-descriptions-item label="企业名称">{{ currentUser.company }}</a-descriptions-item>
          <a-descriptions-item label="联系电话">{{ currentUser.phone }}</a-descriptions-item>
          <a-descriptions-item label="邮箱">{{ currentUser.email }}</a-descriptions-item>
          <a-descriptions-item label="注册时间">{{ currentUser.registerTime }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="currentUser.status === '正常' ? 'green' : 'red'">
              {{ currentUser.status }}
            </a-tag>
          </a-descriptions-item>
        </a-descriptions>

        <a-divider />

        <a-tabs>
          <a-tab-pane key="subscriptions" tab="订阅服务">
            <a-table
              :columns="[
                { title: '服务名称', dataIndex: 'name', key: 'name' },
                { title: '版本', dataIndex: 'version', key: 'version' },
                { title: '开通时间', dataIndex: 'startTime', key: 'startTime' },
                { title: '到期时间', dataIndex: 'endTime', key: 'endTime' },
                { title: '状态', dataIndex: 'status', key: 'status' }
              ]"
              :data-source="[
                {
                  name: '企业大脑基础版',
                  version: '专业版',
                  startTime: '2024-01-01',
                  endTime: '2024-12-31',
                  status: '使用中'
                }
              ]"
              :pagination="false"
            />
          </a-tab-pane>

          <a-tab-pane key="token" tab="Token使用量">
            <a-card>
              <a-row :gutter="16">
                <a-col :span="8">
                  <a-statistic title="本月已使用" :value="15000" suffix="Token" />
                </a-col>
                <a-col :span="8">
                  <a-statistic title="总配额" :value="100000" suffix="Token" />
                </a-col>
                <a-col :span="8">
                  <a-statistic title="使用率" :value="15" suffix="%" />
                </a-col>
              </a-row>
            </a-card>
          </a-tab-pane>

          <a-tab-pane key="datasources" tab="数据源维护">
            <a-table
              :columns="[
                { title: '数据源名称', dataIndex: 'name', key: 'name' },
                { title: '类型', dataIndex: 'type', key: 'type' },
                { title: '更新频率', dataIndex: 'updateFrequency', key: 'updateFrequency' },
                { title: '最近更新', dataIndex: 'lastUpdate', key: 'lastUpdate' },
                { title: '状态', dataIndex: 'status', key: 'status' }
              ]"
              :data-source="[
                {
                  name: '企业知识库',
                  type: '文档库',
                  updateFrequency: '每日',
                  lastUpdate: '2024-01-18',
                  status: '正常'
                }
              ]"
              :pagination="false"
            />
          </a-tab-pane>

          <a-tab-pane key="agents" tab="Agent使用情况">
            <a-table
              :columns="[
                { title: 'Agent名称', dataIndex: 'name', key: 'name' },
                { title: '类型', dataIndex: 'type', key: 'type' },
                { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
                { title: '调用次数', dataIndex: 'callCount', key: 'callCount' },
                { title: '状态', dataIndex: 'status', key: 'status' }
              ]"
              :data-source="[
                {
                  name: '智能客服助手',
                  type: '对话型',
                  createTime: '2024-01-15',
                  callCount: 1250,
                  status: '运行中'
                }
              ]"
              :pagination="false"
            />
          </a-tab-pane>
        </a-tabs>
      </template>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import type { FormInstance } from 'ant-design-vue'
import SearchComponent from '../components/SearchComponent.vue'
import { FilterConfig, SearchField, SortOption, QuickFilter } from '../types/search'

const loading = ref(false)
const searchText = ref('')
const modalVisible = ref(false)
const detailDrawerVisible = ref(false)
const currentUser = ref<any>(null)
const formRef = ref<FormInstance>()
const modalMode = ref<'add' | 'edit'>('add')

const columns = [
  {
    title: '用户ID',
    dataIndex: 'id',
    key: 'id'
  },
  {
    title: '用户名',
    dataIndex: 'username',
    key: 'username'
  },
  {
    title: '企业名称',
    dataIndex: 'company',
    key: 'company'
  },
  {
    title: '联系电话',
    dataIndex: 'phone',
    key: 'phone'
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email'
  },
  {
    title: '注册时间',
    dataIndex: 'registerTime',
    key: 'registerTime'
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status'
  },
  {
    title: '操作',
    key: 'action'
  }
]

const users = ref([
  {
    id: 'U001',
    username: 'user1',
    company: '企业A',
    phone: '13800138000',
    email: 'user1@example.com',
    registerTime: '2023-05-01',
    status: '正常'
  },
  {
    id: 'U002',
    username: 'user2',
    company: '企业B',
    phone: '13800138001',
    email: 'user2@example.com',
    registerTime: '2023-05-02',
    status: '禁用'
  }
])

const formState = reactive({
  username: '',
  company: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名' }],
  company: [{ required: true, message: '请输入企业名称' }],
  phone: [{ required: true, message: '请输入联系电话' }],
  email: [{ required: true, message: '请输入邮箱', type: 'email' }],
  password: [{ required: true, message: '请输入密码' }],
  confirmPassword: [{ required: true, message: '请确认密码' }]
}

const onSearch = (value: string) => {
  console.log('search:', value)
  // 实现搜索逻辑
}

const showAddUserModal = () => {
  modalMode.value = 'add'
  modalVisible.value = true
  Object.keys(formState).forEach(key => {
    formState[key as keyof typeof formState] = ''
  })
}

const showUserDetail = (record: any) => {
  currentUser.value = record
  detailDrawerVisible.value = true
}

const handleModalOk = () => {
  formRef.value?.validate().then(() => {
    console.log('form:', formState)
    // 实现添加/编辑用户逻辑
    modalVisible.value = false
  })
}

const toggleUserStatus = (record: any) => {
  console.log('toggle status:', record)
  // 实现用户状态切换逻辑
}

// 搜索字段配置
const searchFields: SearchField[] = [
  { label: '全部', value: 'all' },
  { label: '用户ID', value: 'id' },
  { label: '用户名', value: 'username' },
  { label: '手机号', value: 'phone' },
  { label: '邮箱', value: 'email' }
]

// 筛选条件配置
const filters: FilterConfig[] = [
  {
    type: 'dateRange',
    label: '注册时间',
    field: 'registerTime',
    span: 8
  },
  {
    type: 'select',
    label: '认证状态',
    field: 'verifyStatus',
    span: 8,
    options: [
      { label: '已认证', value: 'verified' },
      { label: '未认证', value: 'unverified' },
      { label: '认证中', value: 'processing' },
      { label: '认证失败', value: 'failed' }
    ]
  },
  {
    type: 'select',
    label: '账号状态',
    field: 'accountStatus',
    span: 8,
    options: [
      { label: '正常', value: 'active' },
      { label: '禁用', value: 'disabled' }
    ]
  },
  {
    type: 'select',
    label: '订阅状态',
    field: 'subscriptionStatus',
    span: 8,
    options: [
      { label: '已订阅', value: 'subscribed' },
      { label: '未订阅', value: 'unsubscribed' },
      { label: '已过期', value: 'expired' }
    ]
  },
  {
    type: 'dateRange',
    label: '最后登录时间',
    field: 'lastLoginTime',
    span: 8
  },
  {
    type: 'input',
    label: '企业名称',
    field: 'companyName',
    span: 8,
    placeholder: '请输入企业名称'
  }
]

// 排序选项
const sortOptions: SortOption[] = [
  { label: '注册时间：从新到旧', value: 'registerTime,desc' },
  { label: '注册时间：从旧到新', value: 'registerTime,asc' },
  { label: '最后登录时间：从新到旧', value: 'lastLoginTime,desc' },
  { label: '最后登录时间：从旧到新', value: 'lastLoginTime,asc' }
]

// 快捷筛选
const quickFilters: QuickFilter[] = [
  { label: '今日注册', value: { registerTime: 'today' }, color: 'blue' },
  { label: '未认证用户', value: { verifyStatus: 'unverified' }, color: 'orange' },
  { label: '已禁用账号', value: { accountStatus: 'disabled' }, color: 'red' },
  { label: '过期订阅', value: { subscriptionStatus: 'expired' }, color: 'purple' }
]

// 搜索事件处理
const handleSearch = (params: Record<string, any>) => {
  console.log('搜索参数:', params)
  // 调用API获取数据
}

// 筛选事件处理
const handleFilter = (params: Record<string, any>) => {
  console.log('筛选参数:', params)
  // 调用API获取数据
}

// 导出事件处理
const handleExport = (params: Record<string, any>) => {
  console.log('导出参数:', params)
  // 调用API导出数据
}

// 保存筛选条件
const handleSaveFilter = (filter: Record<string, any>) => {
  console.log('保存筛选条件:', filter)
  // 保存筛选条件
}
</script>

<style lang="less" scoped>
.users-view {
  padding: 24px;
  
  :deep(.ant-card) {
    margin-top: 16px;
  }
  
  .card-content {
    margin-bottom: 16px;
  }
  
  .header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    
    .search-wrapper {
      width: 70%;
      max-width: 800px;
    }
    
    .action-wrapper {
      display: flex;
      justify-content: flex-end;
    }
  }
  
  .add-button {
    margin-left: 16px;
  }
  
  // 修改搜索组件样式
  :deep(.custom-search-component) {
    width: 100%;
    
    .ant-input-group {
      display: flex;
      align-items: center;
    }
    
    .ant-input-search {
      width: 100%;
    }
    
    .ant-btn {
      height: 32px;
    }
  }
}
</style>