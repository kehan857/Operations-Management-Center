<template>
  <div class="verification-view">
    <a-page-header
      title="企业认证审核"
      sub-title="审核企业资质认证申请，确保平台企业用户身份真实可信"
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
            <a-radio-group v-model:value="filterStatus" @change="handleFilterChange" class="status-filter">
              <a-radio-button value="all">全部</a-radio-button>
              <a-radio-button value="pending">待审核</a-radio-button>
              <a-radio-button value="approved">已通过</a-radio-button>
              <a-radio-button value="rejected">已拒绝</a-radio-button>
            </a-radio-group>
          </div>
        </div>
      </div>

      <a-table
        :columns="columns"
        :data-source="verifications"
        :loading="loading"
        class="verification-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ record.status }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a @click="viewDetails(record)">查看详情</a>
              <template v-if="record.status === '待审核'">
                <a-button type="primary" size="small" @click="approve(record)">
                  通过
                </a-button>
                <a-button danger size="small" @click="openRejectModal(record)">
                  拒绝
                </a-button>
              </template>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 审核详情抽屉 -->
    <a-drawer
      v-model:visible="drawerVisible"
      title="企业认证详情"
      width="600"
      :footer-style="{ textAlign: 'right' }"
    >
      <template v-if="currentRecord">
        <a-descriptions bordered>
          <a-descriptions-item label="企业名称" :span="3">
            {{ currentRecord.company }}
          </a-descriptions-item>
          <a-descriptions-item label="法人代表" :span="3">
            {{ currentRecord.legalPerson }}
          </a-descriptions-item>
          <a-descriptions-item label="注册资本" :span="3">
            {{ currentRecord.registeredCapital }}
          </a-descriptions-item>
          <a-descriptions-item label="营业执照" :span="3">
            <a-image
              :width="200"
              src="https://placeholder.com/400x300"
              alt="营业执照"
            />
          </a-descriptions-item>
          <a-descriptions-item label="申请时间" :span="3">
            {{ currentRecord.applyTime }}
          </a-descriptions-item>
        </a-descriptions>

        <template v-if="currentRecord.status === '待审核'">
          <div style="margin-top: 24px">
            <a-form layout="vertical">
              <a-form-item label="审核意见" name="comment">
                <a-textarea v-model:value="auditComment" rows="4" />
              </a-form-item>
            </a-form>
          </div>

          <div class="drawer-footer">
            <a-space>
              <a-button @click="drawerVisible = false">取消</a-button>
              <a-button type="primary" @click="approve(currentRecord)">
                通过
              </a-button>
              <a-button danger @click="openRejectModal(currentRecord)">
                拒绝
              </a-button>
            </a-space>
          </div>
        </template>
      </template>
    </a-drawer>

    <!-- 审核拒绝弹窗 -->
    <a-modal
      v-model:visible="rejectModalVisible"
      title="审核拒绝"
      @ok="handleRejectConfirm"
      @cancel="rejectModalVisible = false"
      :okButtonProps="{ disabled: !isRejectReasonValid }"
    >
      <a-form :model="rejectForm" layout="vertical">
        <a-form-item 
          label="拒绝原因" 
          name="rejectReason" 
          :rules="[{ required: true, message: '请选择或填写拒绝原因' }]"
          required
        >
          <a-radio-group v-model:value="rejectForm.reasonType" @change="handleRejectReasonTypeChange">
            <a-radio value="common">常用原因</a-radio>
            <a-radio value="custom">自定义原因</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item v-if="rejectForm.reasonType === 'common'">
          <a-select
            v-model:value="rejectForm.commonReason"
            placeholder="请选择拒绝原因"
            style="width: 100%"
            @change="handleCommonReasonChange"
          >
            <a-select-option v-for="(reason, index) in commonRejectReasons" :key="index" :value="reason">
              {{ reason }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item v-if="rejectForm.reasonType === 'custom'">
          <a-textarea
            v-model:value="rejectForm.customReason"
            placeholder="请输入拒绝原因"
            :rows="4"
            @change="handleCustomReasonChange"
          />
        </a-form-item>

        <a-alert
          v-if="!isRejectReasonValid"
          type="warning"
          message="请选择或填写拒绝原因"
          banner
        />
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import SearchComponent from '../components/SearchComponent.vue'

const loading = ref(false)
const filterStatus = ref('all')
const drawerVisible = ref(false)
const currentRecord = ref<any>(null)
const auditComment = ref('')

// 拒绝弹窗相关
const rejectModalVisible = ref(false)
const rejectForm = ref({
  reasonType: 'common',
  commonReason: '',
  customReason: ''
})

// 常用拒绝原因列表
const commonRejectReasons = [
  '营业执照信息与填写不符',
  '营业执照已过期',
  '企业信息不完整',
  '企业资质材料不清晰',
  '企业未按要求提供补充材料',
  '企业信息存在虚假情况',
  '其他不符合认证要求的情况'
]

// 计算拒绝原因是否有效
const isRejectReasonValid = computed(() => {
  if (rejectForm.value.reasonType === 'common') {
    return !!rejectForm.value.commonReason
  } else {
    return !!rejectForm.value.customReason
  }
})

// 打开拒绝弹窗
const openRejectModal = (record: any) => {
  currentRecord.value = record
  rejectForm.value = {
    reasonType: 'common',
    commonReason: '',
    customReason: ''
  }
  rejectModalVisible.value = true
}

// 处理拒绝原因类型变更
const handleRejectReasonTypeChange = () => {
  // 清空另一种类型的值
  if (rejectForm.value.reasonType === 'common') {
    rejectForm.value.customReason = ''
  } else {
    rejectForm.value.commonReason = ''
  }
}

// 处理常用原因选择
const handleCommonReasonChange = () => {
  // 可以添加一些额外的处理逻辑
}

// 处理自定义原因变更
const handleCustomReasonChange = () => {
  // 可以添加一些额外的处理逻辑
}

// 处理拒绝确认
const handleRejectConfirm = () => {
  if (!isRejectReasonValid.value) {
    return
  }
  
  const reason = rejectForm.value.reasonType === 'common' 
    ? rejectForm.value.commonReason 
    : rejectForm.value.customReason
  
  // 执行拒绝操作
  reject(currentRecord.value, reason)
  rejectModalVisible.value = false
}

// 搜索配置
const searchFields = [
  { label: '全部', value: 'all' },
  { label: '企业名称', value: 'company' },
  { label: '法人代表', value: 'legalPerson' },
  { label: '申请ID', value: 'id' }
]

const filters = [
  {
    type: 'select' as const,
    label: '状态',
    field: 'status',
    options: [
      { label: '待审核', value: 'pending' },
      { label: '已通过', value: 'approved' },
      { label: '已拒绝', value: 'rejected' }
    ]
  },
  {
    type: 'dateRange' as const,
    label: '申请时间',
    field: 'applyTime'
  }
]

const sortOptions = [
  { label: '申请时间降序', value: 'applyTime,desc' },
  { label: '申请时间升序', value: 'applyTime,asc' }
]

const quickFilters = [
  { label: '今日申请', value: { timeRange: 'today' }, color: 'blue' },
  { label: '待审核', value: { status: 'pending' }, color: 'orange' }
]

// 搜索处理函数
const handleSearch = (searchParams: any) => {
  console.log('搜索条件:', searchParams)
  // 这里可以添加根据搜索条件过滤数据的逻辑
}

const handleFilter = (filterParams: any) => {
  console.log('筛选条件:', filterParams)
  // 这里可以添加根据筛选条件过滤数据的逻辑
}

const handleExport = (params: any) => {
  console.log('导出数据:', params)
  // 这里可以添加导出数据的逻辑
}

const handleSaveFilter = (filter: any) => {
  console.log('保存筛选条件:', filter)
  // 这里可以添加保存筛选条件的逻辑
}

const columns = [
  {
    title: '申请ID',
    dataIndex: 'id',
    key: 'id'
  },
  {
    title: '企业名称',
    dataIndex: 'company',
    key: 'company'
  },
  {
    title: '法人代表',
    dataIndex: 'legalPerson',
    key: 'legalPerson'
  },
  {
    title: '申请时间',
    dataIndex: 'applyTime',
    key: 'applyTime'
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

const verifications = ref([
  {
    id: 'V001',
    company: '科技有限公司A',
    legalPerson: '张三',
    registeredCapital: '1000万',
    applyTime: '2023-05-01',
    status: '待审核'
  },
  {
    id: 'V002',
    company: '科技有限公司B',
    legalPerson: '李四',
    registeredCapital: '500万',
    applyTime: '2023-05-02',
    status: '已通过'
  },
  {
    id: 'V003',
    company: '科技有限公司C',
    legalPerson: '王五',
    registeredCapital: '800万',
    applyTime: '2023-05-03',
    status: '已拒绝'
  }
])

const getStatusColor = (status: string) => {
  switch (status) {
    case '待审核':
      return 'orange'
    case '已通过':
      return 'green'
    case '已拒绝':
      return 'red'
    default:
      return 'default'
  }
}

const handleFilterChange = () => {
  // 实现筛选逻辑
}

const viewDetails = (record: any) => {
  currentRecord.value = record
  drawerVisible.value = true
}

const approve = (record: any) => {
  console.log('approve:', record, auditComment.value)
  // 实现审核通过逻辑
  record.status = '已通过'
  message.success(`已通过 ${record.company} 的企业认证申请`)
  drawerVisible.value = false
}

const reject = (record: any, rejectReason?: string) => {
  const reason = rejectReason || auditComment.value
  console.log('reject:', record, '拒绝原因:', reason)
  
  // 实现审核拒绝逻辑
  record.status = '已拒绝'
  message.success(`已拒绝 ${record.company} 的企业认证申请`)
  drawerVisible.value = false
}
</script>

<style lang="less" scoped>
.verification-view {
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
  
  .status-filter {
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

  .drawer-footer {
    position: absolute;
    bottom: 0;
    width: 100%;
    border-top: 1px solid #e8e8e8;
    padding: 10px 16px;
    text-align: right;
    left: 0;
    background: #fff;
  }
}
</style>