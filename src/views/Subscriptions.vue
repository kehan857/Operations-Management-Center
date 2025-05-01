<template>
  <div class="subscriptions-view">
    <a-page-header
      title="订阅计划管理"
      sub-title="管理平台各版本的订阅套餐计划，设置价格和功能特性"
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
            <a-button type="primary" class="add-button" @click="showAddPlanModal">
              <template #icon><PlusOutlined /></template>
              添加套餐
            </a-button>
          </div>
        </div>
      </div>

      <a-table
        :columns="columns"
        :data-source="plans"
        :loading="loading"
        class="plans-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === '已上线' ? 'green' : 'orange'">
              {{ record.status }}
            </a-tag>
          </template>
          <template v-if="column.key === 'features'">
            <a-space>
              <a-tag v-for="feature in record.features" :key="feature">
                {{ feature }}
              </a-tag>
            </a-space>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a @click="showEditModal(record)">编辑</a>
              <a-divider type="vertical" />
              <a-popconfirm
                :title="`确定${record.status === '已上线' ? '下线' : '上线'}该套餐吗？`"
                @confirm="togglePlanStatus(record)"
              >
                <a :style="{ color: record.status === '已上线' ? '#ff4d4f' : '#52c41a' }">
                  {{ record.status === '已上线' ? '下线' : '上线' }}
                </a>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 添加/编辑套餐弹窗 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="modalMode === 'add' ? '添加套餐' : '编辑套餐'"
      @ok="handleModalOk"
      width="800px"
    >
      <a-form
        ref="formRef"
        :model="formState"
        :rules="rules"
        layout="vertical"
      >
        <a-form-item label="套餐名称" name="name">
          <a-input v-model:value="formState.name" />
        </a-form-item>
        <a-form-item label="适用系统" name="system">
          <a-select
            v-model:value="formState.system"
            :options="systems"
            placeholder="请选择适用系统"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="适用对象" name="targetUser">
          <a-textarea
            v-model:value="formState.targetUser"
            placeholder="请描述适用的企业规模、行业等信息"
            rows="2"
          />
        </a-form-item>
        <a-form-item label="Token额度" name="tokenLimit">
          <a-input-number
            v-model:value="formState.tokenLimit"
            :min="0"
            :step="10"
            style="width: 100%"
            addon-after="k"
          />
        </a-form-item>
        <a-form-item label="套餐描述" name="description">
          <a-textarea v-model:value="formState.description" rows="3" />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="月付价格" name="monthlyPrice">
              <a-input-number
                v-model:value="formState.monthlyPrice"
                :min="0"
                :step="100"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="年付价格" name="yearlyPrice">
              <a-input-number
                v-model:value="formState.yearlyPrice"
                :min="0"
                :step="1000"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="功能特性" name="features">
          <a-space direction="vertical" style="width: 100%">
            <a-input
              v-for="(feature, index) in formState.features"
              :key="index"
              v-model:value="formState.features[index]"
              placeholder="请输入功能特性描述"
            >
              <template #suffix>
                <MinusCircleOutlined
                  v-if="formState.features.length > 1"
                  @click="removeFeature(index)"
                />
              </template>
            </a-input>
            <a-button type="dashed" block @click="addFeature">
              <PlusOutlined /> 添加功能特性
            </a-button>
          </a-space>
        </a-form-item>
        <a-form-item name="isRecommended">
          <a-checkbox v-model:checked="formState.isRecommended">设为推荐方案（每个系统仅支持一个推荐方案）</a-checkbox>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons-vue'
import type { FormInstance } from 'ant-design-vue'
import SearchComponent from '../components/SearchComponent.vue'

const loading = ref(false)
const modalVisible = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()

const columns = [
  {
    title: '套餐名称',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: '适用系统',
    dataIndex: 'system',
    key: 'system'
  },
  {
    title: '适用对象',
    dataIndex: 'targetUser',
    key: 'targetUser'
  },
  {
    title: 'Token额度',
    dataIndex: 'tokenLimit',
    key: 'tokenLimit',
    customRender: ({ text }: { text: number }) => `${text}k`
  },
  {
    title: '月付价格',
    dataIndex: 'monthlyPrice',
    key: 'monthlyPrice',
    customRender: ({ text }: { text: number }) => `¥${text}`
  },
  {
    title: '年付价格',
    dataIndex: 'yearlyPrice',
    key: 'yearlyPrice',
    customRender: ({ text }: { text: number }) => `¥${text}`
  },
  {
    title: '功能特性',
    dataIndex: 'features',
    key: 'features'
  },
  {
    title: '推荐方案',
    dataIndex: 'isRecommended',
    key: 'isRecommended',
    customRender: ({ text }: { text: boolean }) => text ? '是' : '否'
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

const plans = ref([
  {
    id: 1,
    name: '基础版',
    description: '适合小型企业使用的基础功能套餐',
    monthlyPrice: 999,
    yearlyPrice: 9999,
    features: ['数据分析', '基础报表', '在线支持'],
    status: '已上线'
  },
  {
    id: 2,
    name: '专业版',
    description: '适合中型企业使用的专业功能套餐',
    monthlyPrice: 1999,
    yearlyPrice: 19999,
    features: ['数据分析', '高级报表', '在线支持', 'API接口', '自定义仪表盘'],
    status: '已上线'
  }
])

const systems = [
  { label: '企业大脑', value: 'enterprise_brain' },
  { label: '数据中台', value: 'data_platform' },
  { label: '业务中台', value: 'business_platform' }
]

const formState = reactive({
  name: '',
  system: '',
  targetUser: '',
  tokenLimit: 0,
  description: '',
  monthlyPrice: 0,
  yearlyPrice: 0,
  features: [''] as string[],
  isRecommended: false
})

const rules = {
  name: [{ required: true, message: '请输入套餐名称' }],
  system: [{ required: true, message: '请选择适用系统' }],
  targetUser: [{ required: true, message: '请输入适用对象描述' }],
  tokenLimit: [{ required: true, message: '请输入Token额度' }],
  description: [{ required: true, message: '请输入套餐描述' }],
  monthlyPrice: [{ required: true, message: '请输入月付价格' }],
  yearlyPrice: [{ required: true, message: '请输入年付价格' }],
  features: [{ required: true, message: '请至少添加一个功能特性' }]
}

// 搜索配置
const searchFields = [
  { label: '全部', value: 'all' },
  { label: '套餐名称', value: 'name' },
  { label: '适用系统', value: 'system' },
  { label: '功能特性', value: 'features' }
]

const filters = [
  {
    type: 'select' as const,
    label: '适用系统',
    field: 'system',
    options: [
      { label: '企业大脑', value: 'enterprise_brain' },
      { label: '数据中台', value: 'data_platform' },
      { label: '业务中台', value: 'business_platform' }
    ]
  },
  {
    type: 'select' as const,
    label: '状态',
    field: 'status',
    options: [
      { label: '已上线', value: 'online' },
      { label: '已下线', value: 'offline' }
    ]
  },
  {
    type: 'select' as const,
    label: '推荐方案',
    field: 'isRecommended',
    options: [
      { label: '是', value: 'true' },
      { label: '否', value: 'false' }
    ]
  },
  {
    type: 'numberRange' as const,
    label: '月付价格',
    field: 'monthlyPrice'
  }
]

const sortOptions = [
  { label: '月付价格：从低到高', value: 'monthlyPrice,asc' },
  { label: '月付价格：从高到低', value: 'monthlyPrice,desc' },
  { label: '年付价格：从低到高', value: 'yearlyPrice,asc' },
  { label: '年付价格：从高到低', value: 'yearlyPrice,desc' },
  { label: 'Token额度：从低到高', value: 'tokenLimit,asc' },
  { label: 'Token额度：从高到低', value: 'tokenLimit,desc' }
]

const quickFilters = [
  { label: '已上线', value: { status: 'online' }, color: 'green' },
  { label: '推荐方案', value: { isRecommended: 'true' }, color: 'blue' }
]

const showAddPlanModal = () => {
  modalMode.value = 'add'
  modalVisible.value = true
  Object.assign(formState, {
    name: '',
    description: '',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [''] as string[]
  })
}

const showEditModal = (record: any) => {
  modalMode.value = 'edit'
  modalVisible.value = true
  Object.assign(formState, {
    name: record.name,
    description: record.description,
    monthlyPrice: record.monthlyPrice,
    yearlyPrice: record.yearlyPrice,
    features: [...record.features]
  })
}

const handleModalOk = () => {
  formRef.value?.validate().then(() => {
    console.log('form:', formState)
    // 实现添加/编辑套餐逻辑
    modalVisible.value = false
  })
}

const togglePlanStatus = (record: any) => {
  console.log('toggle status:', record)
  // 实现套餐状态切换逻辑
}

const addFeature = () => {
  formState.features.push('')
}

const removeFeature = (index: number) => {
  formState.features.splice(index, 1)
}

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
</script>

<style lang="less" scoped>
.subscriptions-view {
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