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
        
        <!-- 功能权限配置区域 -->
        <a-form-item label="功能权限配置" name="permissions">
          <div class="permissions-config">
            <div class="permissions-header">
              <a-input-search
                v-model:value="permissionSearchText"
                placeholder="搜索功能名称或描述"
                @change="handlePermissionSearch"
                style="width: 300px;"
              />
            </div>
            
            <div class="permissions-list">
              <!-- 基础资源配额 -->
              <a-card title="基础资源配额" class="permission-card" v-if="showGroup('pg-1')">
                <a-table 
                  :columns="permissionColumns" 
                  :data-source="getGroupPermissions('pg-1')"
                  :pagination="false"
                  :rowKey="(record: any) => record.id"
                >
                  <template #bodyCell="{ column, record }: { column: any, record: any }">
                    <template v-if="column.dataIndex === 'control'">
                      <!-- 数字输入控件 -->
                      <a-input-number
                        v-if="record.type === 'number'"
                        v-model:value="formState.permissions[record.id]"
                        :min="record.min"
                        :max="record.max"
                        :step="record.step"
                        style="width: 150px;"
                      />
                      
                      <!-- 滑块控件 -->
                      <div v-else-if="record.type === 'slider'" class="slider-with-input">
                        <a-slider
                          v-model:value="formState.permissions[record.id]"
                          :min="record.min"
                          :max="record.max"
                          style="width: 200px; margin-right: 16px;"
                          :disabled="formState.permissions[record.id] === -1"
                        />
                        <div class="input-with-checkbox">
                          <a-input-number
                            v-if="formState.permissions[record.id] !== -1"
                            v-model:value="formState.permissions[record.id]"
                            :min="record.min"
                            :max="record.max"
                            style="width: 100px;"
                            :addon-after="record.unit || ''"
                          />
                          <span v-else class="unlimited-text">无限制</span>
                          
                          <a-checkbox 
                            v-if="record.specialOptions"
                            :checked="formState.permissions[record.id] === -1"
                            style="margin-left: 8px;"
                            @change="e => formState.permissions[record.id] = e.target.checked ? -1 : record.default"
                          >
                            无限制
                          </a-checkbox>
                        </div>
                      </div>
                      
                      <!-- 复选框控件 -->
                      <a-checkbox-group 
                        v-else-if="record.type === 'checkbox'"
                        v-model:value="formState.permissions[record.id]" 
                        :options="record.options"
                      />
                    </template>
                  </template>
                </a-table>
              </a-card>
              
              <!-- Agent功能 -->
              <a-card title="Agent功能" class="permission-card" v-if="showGroup('pg-2')">
                <a-table 
                  :columns="permissionColumns" 
                  :data-source="getGroupPermissions('pg-2')"
                  :pagination="false"
                  :rowKey="(record: any) => record.id"
                >
                  <template #bodyCell="{ column, record }: { column: any, record: any }">
                    <template v-if="column.dataIndex === 'control'">
                      <!-- 数字输入控件 -->
                      <a-input-number
                        v-if="record.type === 'number'"
                        v-model:value="formState.permissions[record.id]"
                        :min="record.min"
                        :max="record.max"
                        :step="record.step"
                        style="width: 150px;"
                      />
                      
                      <!-- 滑块控件 -->
                      <div v-else-if="record.type === 'slider'" class="slider-with-input">
                        <a-slider
                          v-model:value="formState.permissions[record.id]"
                          :min="record.min"
                          :max="record.max"
                          style="width: 200px; margin-right: 16px;"
                          :disabled="formState.permissions[record.id] === -1"
                        />
                        <div class="input-with-checkbox">
                          <a-input-number
                            v-if="formState.permissions[record.id] !== -1"
                            v-model:value="formState.permissions[record.id]"
                            :min="record.min"
                            :max="record.max"
                            style="width: 100px;"
                            :addon-after="record.unit || ''"
                          />
                          <span v-else class="unlimited-text">无限制</span>
                          
                          <a-checkbox 
                            v-if="record.specialOptions"
                            :checked="formState.permissions[record.id] === -1"
                            style="margin-left: 8px;"
                            @change="e => formState.permissions[record.id] = e.target.checked ? -1 : record.default"
                          >
                            无限制
                          </a-checkbox>
                        </div>
                      </div>
                      
                      <!-- 复选框控件 -->
                      <a-checkbox-group 
                        v-else-if="record.type === 'checkbox'"
                        v-model:value="formState.permissions[record.id]" 
                        :options="record.options"
                      />
                    </template>
                  </template>
                </a-table>
              </a-card>
              
              <!-- 业务功能 -->
              <a-card title="业务功能" class="permission-card" v-if="showGroup('pg-4')">
                <a-table 
                  :columns="permissionColumns" 
                  :data-source="getGroupPermissions('pg-4')"
                  :pagination="false"
                  :rowKey="(record: any) => record.id"
                >
                  <template #bodyCell="{ column, record }: { column: any, record: any }">
                    <template v-if="column.dataIndex === 'control'">
                      <!-- 数字输入控件 -->
                      <a-input-number
                        v-if="record.type === 'number'"
                        v-model:value="formState.permissions[record.id]"
                        :min="record.min"
                        :max="record.max"
                        :step="record.step"
                        style="width: 150px;"
                      />
                      
                      <!-- 滑块控件 -->
                      <div v-else-if="record.type === 'slider'" class="slider-with-input">
                        <a-slider
                          v-model:value="formState.permissions[record.id]"
                          :min="record.min"
                          :max="record.max"
                          style="width: 200px; margin-right: 16px;"
                          :disabled="formState.permissions[record.id] === -1"
                        />
                        <div class="input-with-checkbox">
                          <a-input-number
                            v-if="formState.permissions[record.id] !== -1"
                            v-model:value="formState.permissions[record.id]"
                            :min="record.min"
                            :max="record.max"
                            style="width: 100px;"
                            :addon-after="record.unit || ''"
                          />
                          <span v-else class="unlimited-text">无限制</span>
                          
                          <a-checkbox 
                            v-if="record.specialOptions"
                            :checked="formState.permissions[record.id] === -1"
                            style="margin-left: 8px;"
                            @change="e => formState.permissions[record.id] = e.target.checked ? -1 : record.default"
                          >
                            无限制
                          </a-checkbox>
                        </div>
                      </div>
                      
                      <!-- 复选框控件 -->
                      <a-checkbox-group 
                        v-else-if="record.type === 'checkbox'"
                        v-model:value="formState.permissions[record.id]" 
                        :options="record.options"
                      />
                    </template>
                  </template>
                </a-table>
              </a-card>
            </div>
          </div>
        </a-form-item>
        
        <a-form-item name="isRecommended">
          <a-checkbox v-model:checked="formState.isRecommended">设为推荐方案（每个系统仅支持一个推荐方案）</a-checkbox>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, h } from 'vue'
import { PlusOutlined, MinusCircleOutlined, EditOutlined, SlidersFilled } from '@ant-design/icons-vue'
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
    features: ['数据分析', '基础报表', '在线支持', '最多10个用户'],
    status: '已上线'
  },
  {
    id: 2,
    name: '专业版',
    description: '适合中型企业使用的专业功能套餐',
    monthlyPrice: 1999,
    yearlyPrice: 19999,
    features: ['数据分析', '高级报表', '在线支持', 'API接口', '自定义仪表盘', '最多50个用户'],
    status: '已上线'
  },
  {
    id: 3,
    name: '企业版',
    description: '适合大型企业使用的全功能套餐',
    monthlyPrice: 4999,
    yearlyPrice: 49999,
    features: ['数据分析', '高级报表', '在线支持', 'API接口', '自定义仪表盘', '多场景工作流', '高级权限控制', '专属客户经理', '无限用户数'],
    status: '已上线',
    isRecommended: true
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
  permissions: {} as Record<string, any>,
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
  
  // 预设权限配置
  const permissionsConfig: Record<string, any> = {
    'p-8': 10 // 默认设置为10个用户
  }
  
  Object.assign(formState, {
    name: '',
    system: 'enterprise_brain',
    targetUser: '',
    tokenLimit: 0,
    description: '',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [''] as string[],
    permissions: permissionsConfig,
    isRecommended: false
  })
}

const showEditModal = (record: any) => {
  modalMode.value = 'edit'
  modalVisible.value = true
  
  // 预设权限配置
  const permissionsConfig: Record<string, any> = {}
  
  // 根据套餐名称预设用户数量
  if (record.name === '基础版') {
    permissionsConfig['p-8'] = 10 // 基础版10个用户
  } else if (record.name === '专业版') {
    permissionsConfig['p-8'] = 50 // 专业版50个用户
  } else if (record.name === '企业版') {
    permissionsConfig['p-8'] = -1 // 企业版无限用户
  }
  
  Object.assign(formState, {
    name: record.name,
    description: record.description,
    system: record.system || 'enterprise_brain',
    targetUser: record.targetUser || '',
    tokenLimit: record.tokenLimit || 0,
    monthlyPrice: record.monthlyPrice,
    yearlyPrice: record.yearlyPrice,
    features: [...record.features],
    permissions: permissionsConfig,
    isRecommended: record.isRecommended || false
  })
}

const handleModalOk = () => {
  formRef.value?.validate().then(() => {
    console.log('form:', formState)
    
    // 检查是否已经包含用户数限制的描述
    const userLimitFeatureIndex = formState.features.findIndex(feature => 
      feature.includes('用户') && (feature.includes('限制') || feature.includes('最多') || feature.includes('无限'))
    )
    
    // 根据用户数限制添加或更新功能特性描述
    const userLimit = formState.permissions['p-8']
    let userLimitFeature = ''
    
    if (userLimit === -1) {
      userLimitFeature = '无限用户数'
    } else {
      userLimitFeature = `最多${userLimit}个用户`
    }
    
    if (userLimitFeatureIndex >= 0) {
      // 更新现有描述
      formState.features[userLimitFeatureIndex] = userLimitFeature
    } else {
      // 添加新描述
      formState.features.push(userLimitFeature)
    }
    
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

// 功能权限配置相关
const permissionSearchText = ref('')
const activePermissionGroups = ref<string[]>(['pg-1', 'pg-2'])

// 权限组配置
const permissionGroups = [
  {
    id: 'pg-1',
    name: '基础资源配额',
    permissions: [
      {
        id: 'p-1',
        name: '数据源连接数',
        description: '允许用户配置的最大数据源数量',
        type: 'number',
        min: 1,
        max: 100,
        step: 1,
        default: 5
      },
      {
        id: 'p-2',
        name: '知识库容量',
        description: '知识库最大存储空间',
        type: 'slider',
        min: 1,
        max: 100,
        unit: 'GB',
        default: 10
      },
      {
        id: 'p-3',
        name: 'API调用次数',
        description: '每日API调用限额',
        type: 'number',
        min: 1000,
        max: 1000000,
        step: 1000,
        default: 10000
      },
      {
        id: 'p-11',
        name: 'Token额度',
        description: '允许用户使用的最大Token数量',
        type: 'slider',
        min: 0,
        max: 1000,
        unit: 'k',
        default: 0
      }
    ]
  },
  {
    id: 'pg-2',
    name: 'Agent功能',
    permissions: [
      {
        id: 'p-4',
        name: '可用Agent模板',
        description: '允许使用的Agent模板列表',
        type: 'checkbox',
        options: [
          { label: '客服Agent', value: 'agent-customer-service' },
          { label: '销售Agent', value: 'agent-sales' },
          { label: '数据分析Agent', value: 'agent-data-analysis' },
          { label: '文档摘要Agent', value: 'agent-document-summary' },
          { label: '市场调研Agent', value: 'agent-market-research' }
        ],
        default: ['agent-customer-service']
      },
      {
        id: 'p-5',
        name: 'Agent使用次数',
        description: '每月可使用的Agent调用次数',
        type: 'number',
        min: 100,
        max: 10000,
        step: 100,
        default: 500
      }
    ]
  },
  {
    id: 'pg-4',
    name: '业务功能',
    permissions: [
      {
        id: 'p-8',
        name: '用户数量',
        description: '允许的最大用户数量（设置为-1表示无限制）',
        type: 'slider',
        min: 5,
        max: 1000,
        default: 10,
        specialOptions: [
          { label: '无限制', value: -1 }
        ]
      },
      {
        id: 'p-10',
        name: '业务功能模块',
        description: '可访问的业务功能模块',
        type: 'checkbox',
        options: [
          { label: '智能分析中心', value: 'analysis-center' },
          { label: '智能告警中心', value: 'alert-center' },
          { label: '智能预测中心', value: 'forecast-center' }
        ],
        default: []
      }
    ]
  }
]

// 根据搜索过滤权限组
const filteredPermissionGroups = computed(() => {
  return permissionGroups.filter(group => {
    // 如果有搜索文本，检查是否任何权限匹配搜索
    if (permissionSearchText.value) {
      return group.permissions.some(p => matchesPermissionSearch(p))
    }
    
    return true
  })
})

// 检查权限是否匹配搜索文本
const matchesPermissionSearch = (permission: any) => {
  if (!permissionSearchText.value) return true
  
  const searchText = permissionSearchText.value.toLowerCase()
  return (
    permission.name.toLowerCase().includes(searchText) ||
    permission.description.toLowerCase().includes(searchText)
  )
}

// 处理权限搜索
const handlePermissionSearch = () => {
  // 搜索时可能需要展开所有分组
  if (permissionSearchText.value) {
    activePermissionGroups.value = permissionGroups.map(g => g.id)
  }
}

// 渲染不同类型的权限配置控件 - 设置默认值
const renderPermissionItem = (item: any) => {
  // 初始化权限的默认值
  if (modalMode.value === 'add' && formState.permissions[item.id] === undefined) {
    formState.permissions[item.id] = item.default
  }
  return item
}

// 根据权限组ID获取权限列表
const getGroupPermissions = (groupId: string) => {
  const group = permissionGroups.find(g => g.id === groupId)
  return group?.permissions.filter(matchesPermissionSearch).map(renderPermissionItem) || []
}

// 根据权限组ID判断是否显示
const showGroup = (groupId: string) => {
  // 如果没有搜索条件或者组内有匹配项
  const group = permissionGroups.find(g => g.id === groupId)
  if (!permissionSearchText.value || (group && group.permissions.some(matchesPermissionSearch))) {
    return true
  }
  return false
}

// 权限列配置
const permissionColumns = [
  {
    title: '功能名称',
    dataIndex: 'name',
    key: 'name',
    width: '25%'
  },
  {
    title: '功能描述',
    dataIndex: 'description',
    key: 'description',
    width: '40%'
  },
  {
    title: '控制',
    dataIndex: 'control',
    key: 'control',
    width: '35%'
  }
]
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
  
  // 权限配置样式
  .permissions-config {
    border: 1px solid #f0f0f0;
    border-radius: 4px;
    padding: 16px;
    background-color: #fafafa;
    
    .permissions-header {
      display: flex;
      margin-bottom: 16px;
    }
    
    .permissions-list {
      margin-top: 8px;
      
      .permission-card {
        margin-bottom: 16px;
        
        :deep(.ant-card-head) {
          background-color: #f9f9f9;
        }
        
        :deep(.ant-table-thead > tr > th) {
          background-color: #f5f5f5;
        }
        
        :deep(.ant-table-row:hover) {
          background-color: #f0f7ff;
        }
      }
    }
    
    .slider-with-input {
      display: flex;
      align-items: center;
      
      .input-with-checkbox {
        display: flex;
        align-items: center;
      }
      
      .unlimited-text {
        width: 100px;
        text-align: center;
        font-weight: bold;
        color: #1890ff;
      }
    }
  }
}
</style>