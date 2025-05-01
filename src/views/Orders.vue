<template>
  <div class="orders-view">
    <a-page-header
      title="订单管理"
      sub-title="管理平台所有订单信息，包括支付状态和订单详情"
    />

    <a-card>
      <div class="card-content">
        <div class="search-container">
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
      </div>

      <a-table
        :columns="columns"
        :data-source="orders"
        :loading="loading"
        class="order-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ record.status }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a @click="showOrderDetail(record)">查看详情</a>
              <template v-if="record.status === '待支付'">
                <a-divider type="vertical" />
                <a-popconfirm
                  title="确定要取消该订单吗？"
                  @confirm="cancelOrder(record)"
                >
                  <a style="color: #ff4d4f">取消订单</a>
                </a-popconfirm>
              </template>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 订单详情抽屉 -->
    <a-drawer
      v-model:visible="drawerVisible"
      title="订单详情"
      width="600"
    >
      <template v-if="currentOrder">
        <a-descriptions bordered>
          <a-descriptions-item label="订单编号" :span="3">
            {{ currentOrder.id }}
          </a-descriptions-item>
          <a-descriptions-item label="企业名称" :span="3">
            {{ currentOrder.company }}
          </a-descriptions-item>
          <a-descriptions-item label="订购产品" :span="3">
            {{ currentOrder.product }}
          </a-descriptions-item>
          <a-descriptions-item label="订单金额" :span="3">
            ¥{{ currentOrder.amount }}
          </a-descriptions-item>
          <a-descriptions-item label="支付方式" :span="3">
            {{ currentOrder.paymentMethod }}
          </a-descriptions-item>
          <a-descriptions-item label="订单状态" :span="3">
            <a-tag :color="getStatusColor(currentOrder.status)">
              {{ currentOrder.status }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="创建时间" :span="3">
            {{ currentOrder.createTime }}
          </a-descriptions-item>
          <a-descriptions-item label="支付时间" :span="3">
            {{ currentOrder.payTime || '-' }}
          </a-descriptions-item>
        </a-descriptions>

        <a-divider>订单日志</a-divider>
        <a-timeline>
          <a-timeline-item v-for="log in currentOrder.logs" :key="log.time">
            {{ log.time }} - {{ log.action }}
          </a-timeline-item>
        </a-timeline>
      </template>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { Dayjs } from 'dayjs'
import SearchComponent from '../components/SearchComponent.vue'

const loading = ref(false)
const searchText = ref('')
const statusFilter = ref('all')
const dateRange = ref<[Dayjs, Dayjs]>()
const drawerVisible = ref(false)
const currentOrder = ref<any>(null)

// 搜索配置
const searchFields = [
  { label: '全部', value: 'all' },
  { label: '订单编号', value: 'id' },
  { label: '企业名称', value: 'company' },
  { label: '订购产品', value: 'product' }
]

const filters = [
  {
    type: 'select' as const,
    label: '订单状态',
    field: 'status',
    options: [
      { label: '待支付', value: 'pending' },
      { label: '已支付', value: 'paid' },
      { label: '已完成', value: 'completed' },
      { label: '已取消', value: 'cancelled' }
    ]
  },
  {
    type: 'dateRange' as const,
    label: '创建时间',
    field: 'createTime'
  },
  {
    type: 'dateRange' as const,
    label: '支付时间',
    field: 'payTime'
  },
  {
    type: 'select' as const,
    label: '支付方式',
    field: 'paymentMethod',
    options: [
      { label: '支付宝', value: 'alipay' },
      { label: '微信支付', value: 'wechat' },
      { label: '银行转账', value: 'bank' }
    ]
  },
  {
    type: 'numberRange' as const,
    label: '订单金额',
    field: 'amount'
  }
]

const sortOptions = [
  { label: '创建时间：从新到旧', value: 'createTime,desc' },
  { label: '创建时间：从旧到新', value: 'createTime,asc' },
  { label: '订单金额：从高到低', value: 'amount,desc' },
  { label: '订单金额：从低到高', value: 'amount,asc' }
]

const quickFilters = [
  { label: '待支付', value: { status: 'pending' }, color: 'orange' },
  { label: '已完成', value: { status: 'completed' }, color: 'green' },
  { label: '今日订单', value: { createTime: 'today' }, color: 'blue' }
]

// 搜索处理函数
const handleSearch = (searchParams: any) => {
  console.log('搜索参数:', searchParams)
  // 调用API获取数据
  loading.value = true
  setTimeout(() => {
    // 模拟API调用
    loading.value = false
  }, 500)
}

const handleFilter = (filterParams: any) => {
  console.log('筛选参数:', filterParams)
  // 调用API获取数据
  loading.value = true
  setTimeout(() => {
    // 模拟API调用
    loading.value = false
  }, 500)
}

const handleExport = (params: any) => {
  console.log('导出参数:', params)
  // 调用API导出数据
}

const handleSaveFilter = (filter: any) => {
  console.log('保存筛选条件:', filter)
  // 保存筛选条件
}

const columns = [
  {
    title: '订单编号',
    dataIndex: 'id',
    key: 'id'
  },
  {
    title: '企业名称',
    dataIndex: 'company',
    key: 'company'
  },
  {
    title: '订购产品',
    dataIndex: 'product',
    key: 'product'
  },
  {
    title: '订单金额',
    dataIndex: 'amount',
    key: 'amount',
    customRender: ({ text }: { text: number }) => `¥${text}`
  },
  {
    title: '支付方式',
    dataIndex: 'paymentMethod',
    key: 'paymentMethod'
  },
  {
    title: '订单状态',
    dataIndex: 'status',
    key: 'status'
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime'
  },
  {
    title: '操作',
    key: 'action'
  }
]

const orders = ref([
  {
    id: 'ORD001',
    company: '企业A',
    product: '企业大脑基础版',
    amount: 5000,
    paymentMethod: '支付宝',
    status: '已完成',
    createTime: '2023-05-01 10:00:00',
    payTime: '2023-05-01 10:30:00',
    logs: [
      { time: '2023-05-01 10:00:00', action: '订单创建' },
      { time: '2023-05-01 10:30:00', action: '支付完成' },
      { time: '2023-05-01 11:00:00', action: '订单完成' }
    ]
  },
  {
    id: 'ORD002',
    company: '企业B',
    product: '企业大脑专业版',
    amount: 8000,
    paymentMethod: '银行转账',
    status: '待支付',
    createTime: '2023-05-02 14:00:00',
    payTime: null,
    logs: [
      { time: '2023-05-02 14:00:00', action: '订单创建' }
    ]
  }
])

const getStatusColor = (status: string) => {
  switch (status) {
    case '待支付':
      return 'orange'
    case '已支付':
      return 'blue'
    case '已完成':
      return 'green'
    case '已取消':
      return 'red'
    default:
      return 'default'
  }
}

const showOrderDetail = (record: any) => {
  currentOrder.value = record
  drawerVisible.value = true
}

const cancelOrder = (record: any) => {
  console.log('cancel order:', record)
  // 实现取消订单逻辑
}
</script>

<style lang="less" scoped>
.orders-view {
  padding: 24px;
  
  :deep(.ant-card) {
    margin-top: 16px;
  }
  
  .card-content {
    margin-bottom: 16px;
  }
  
  .search-container {
    width: 100%;
    max-width: 800px;
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