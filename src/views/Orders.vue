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
              <template v-if="record.paymentMethod === '银行转账' && record.status === '待支付'">
                <a-divider type="vertical" />
                <a @click="showOfflinePaymentModal(record)">录入线下转账</a>
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

    <!-- 线下转账录入弹窗 -->
    <a-modal
      v-model:visible="offlinePaymentModalVisible"
      title="线下转账录入"
      width="700px"
      @ok="handleOfflinePaymentSubmit"
    >
      <a-form
        ref="offlinePaymentFormRef"
        :model="offlinePaymentForm"
        :rules="offlinePaymentRules"
        layout="vertical"
      >
        <a-divider orientation="left">企业信息</a-divider>
        
        <a-form-item label="企业名称">
          <a-input
            v-model:value="offlinePaymentForm.companyName"
            placeholder="企业名称"
            disabled
          />
        </a-form-item>
        
        <a-form-item label="企业统一社会信用代码">
          <a-input 
            v-model:value="offlinePaymentForm.creditCode" 
            placeholder="企业统一社会信用代码"
            disabled
          />
        </a-form-item>
        
        <a-form-item label="关联用户">
          <a-input
            v-model:value="offlinePaymentForm.userInfo"
            placeholder="关联用户"
            disabled
          />
        </a-form-item>
        
        <a-divider orientation="left">转账信息</a-divider>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="转账金额" name="amount">
              <a-input-number
                v-model:value="offlinePaymentForm.amount"
                :min="0"
                style="width: 100%"
                placeholder="请输入转账金额"
                addon-before="¥"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="转账时间" name="transferTime">
              <a-date-picker
                v-model:value="offlinePaymentForm.transferTime"
                style="width: 100%"
                show-time
                format="YYYY-MM-DD HH:mm:ss"
                placeholder="请选择转账时间"
              />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="转账银行" name="bank">
              <a-input
                v-model:value="offlinePaymentForm.bank"
                placeholder="请输入转账银行"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="转账流水号" name="transactionId">
              <a-input
                v-model:value="offlinePaymentForm.transactionId"
                placeholder="请输入转账流水号"
              />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-form-item label="订阅套餐">
          <a-input
            v-model:value="offlinePaymentForm.subscriptionPlanName"
            placeholder="订阅套餐"
            disabled
          />
        </a-form-item>
        
        <a-form-item label="转账凭证" name="paymentProof">
          <a-upload
            v-model:fileList="offlinePaymentForm.paymentProof"
            :before-upload="beforeUpload"
            action="/api/upload"
            list-type="picture-card"
          >
            <div v-if="offlinePaymentForm.paymentProof.length < 1">
              <div class="ant-upload-text">上传凭证</div>
              <p class="ant-upload-hint">
                支持 JPG, PNG, PDF 格式
              </p>
            </div>
          </a-upload>
        </a-form-item>
        
        <a-form-item label="备注" name="remark">
          <a-textarea
            v-model:value="offlinePaymentForm.remark"
            rows="3"
            placeholder="请输入备注信息"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import type { Dayjs } from 'dayjs'
import type { FormInstance, UploadProps } from 'ant-design-vue'
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

// 线下转账录入相关
const offlinePaymentModalVisible = ref(false)
const offlinePaymentFormRef = ref<FormInstance>()
const creditCodeValidateStatus = ref('')
const currentEditOrder = ref<any>(null)

// 企业搜索
const companyOptions = ref<{ value: string }[]>([])
const handleCompanySearch = (query: string) => {
  if (query) {
    // 模拟API搜索结果
    companyOptions.value = [
      { value: '天云科技有限公司' },
      { value: '天云数据科技（北京）有限公司' },
      { value: '天云智能科技（上海）有限公司' }
    ].filter(item => item.value.includes(query))
  } else {
    companyOptions.value = []
  }
}

// 用户搜索
const userOptions = ref<{ label: string; value: string; userName: string }[]>([])
const handleUserSearch = (query: string) => {
  if (query) {
    // 模拟API搜索结果
    userOptions.value = [
      { label: '张三 (ID: U1001)', value: 'U1001', userName: '张三' },
      { label: '李四 (ID: U1002)', value: 'U1002', userName: '李四' },
      { label: '王五 (ID: U1003)', value: 'U1003', userName: '王五' }
    ].filter(item => item.label.includes(query))
  } else {
    userOptions.value = []
  }
}

// 订阅套餐
const subscriptionPlans = ref([
  { label: '企业大脑基础版 (月付¥999)', value: 'basic-monthly' },
  { label: '企业大脑基础版 (年付¥9999)', value: 'basic-yearly' },
  { label: '企业大脑专业版 (月付¥1999)', value: 'pro-monthly' },
  { label: '企业大脑专业版 (年付¥19999)', value: 'pro-yearly' }
])

// 社会信用代码验证
const validateCreditCode = () => {
  const code = offlinePaymentForm.creditCode
  if (!code) {
    creditCodeValidateStatus.value = ''
    return
  }
  
  // 社会信用代码正则验证
  const pattern = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/
  if (pattern.test(code)) {
    creditCodeValidateStatus.value = 'success'
  } else {
    creditCodeValidateStatus.value = 'error'
  }
}

// 上传前检查
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isJpgOrPngOrPdf = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'application/pdf'
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isJpgOrPngOrPdf) {
    alert('只能上传JPG、PNG或PDF格式的文件!')
  }
  
  if (!isLt10M) {
    alert('文件大小不能超过10MB!')
  }
  
  return isJpgOrPngOrPdf && isLt10M
}

// 表单数据
const offlinePaymentForm = reactive({
  companyName: '',
  creditCode: '',
  userId: '',
  userInfo: '',
  amount: null as number | null,
  transferTime: null as Dayjs | null,
  bank: '',
  transactionId: '',
  subscriptionPlan: '',
  subscriptionPlanName: '',
  paymentProof: [] as any[],
  remark: ''
})

// 表单验证规则
const offlinePaymentRules = {
  amount: [{ required: true, message: '请输入转账金额' }],
  transferTime: [{ required: true, message: '请选择转账时间' }],
  paymentProof: [{ required: true, message: '请上传转账凭证' }]
}

// 显示线下转账录入弹窗
const showOfflinePaymentModal = (record: any) => {
  currentEditOrder.value = record
  
  // 预填写表单数据
  offlinePaymentForm.companyName = record.company
  offlinePaymentForm.creditCode = record.creditCode || '91110000123456789X'  // 假设订单中包含企业信用代码
  offlinePaymentForm.userInfo = record.contactUser || '张三 (ID: U1001)' // 假设订单中包含联系人信息
  offlinePaymentForm.userId = record.userId || 'U1001' // 假设订单中包含用户ID
  
  // 设置套餐信息
  offlinePaymentForm.subscriptionPlanName = record.product
  offlinePaymentForm.subscriptionPlan = record.productId || ''
  
  // 预设金额
  offlinePaymentForm.amount = record.amount
  
  offlinePaymentModalVisible.value = true
}

// 提交线下转账表单
const handleOfflinePaymentSubmit = () => {
  offlinePaymentFormRef.value?.validate().then(() => {
    console.log('表单数据:', offlinePaymentForm)
    // 实现提交逻辑，可以调用API创建新订单
    offlinePaymentModalVisible.value = false
  }).catch(err => {
    console.error('表单验证失败:', err)
  })
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
    
    .search-container {
      width: 100%;
      max-width: 800px;
    }
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
  
  .error-message {
    color: #ff4d4f;
    font-size: 12px;
    margin-top: 4px;
  }
  
  .success-message {
    color: #52c41a;
    font-size: 12px;
    margin-top: 4px;
  }
}
</style>