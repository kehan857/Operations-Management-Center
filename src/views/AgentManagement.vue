<template>
  <div class="agent-management">
    <a-page-header
      title="Agent管理平台"
      sub-title="管理和配置企业大脑平台的智能体(Agent)，确保其安全、有效地运行"
    />

    <div class="agent-list">
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
              <a-button type="primary" class="add-button" @click="handleAddAgent">
                <template #icon><PlusOutlined /></template>
                新增Agent
              </a-button>
            </div>
          </div>
        </div>

        <a-table
          :columns="agentColumns"
          :data-source="agentData"
          :loading="loading"
          rowKey="id"
          class="agent-table"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <a-tag :color="record.status === 'enabled' ? 'green' : 'red'">
                {{ record.status === 'enabled' ? '启用' : '禁用' }}
              </a-tag>
            </template>
            <template v-if="column.key === 'action'">
              <a-space>
                <a @click="handleEditAgent(record)">编辑</a>
                <a-divider type="vertical" />
                <a @click="handleViewAgent(record)">查看</a>
                <a-divider type="vertical" />
                <a-switch
                  :checked="record.status === 'enabled'"
                  @change="(checked: boolean) => handleToggleStatus(record, checked)"
                />
              </a-space>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>

    <!-- Agent配置弹窗 -->
    <a-modal
      v-model:visible="agentModalVisible"
      :title="agentModalTitle"
      width="800px"
      @ok="handleAgentModalOk"
    >
      <a-form
        :model="agentForm"
        :rules="agentRules"
        ref="agentFormRef"
        layout="vertical"
      >
        <a-divider>基本信息</a-divider>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="Agent名称" name="name">
              <a-input v-model:value="agentForm.name" placeholder="请输入名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="Agent类型" name="type">
              <a-select v-model:value="agentForm.type" placeholder="请选择类型">
                <a-select-option value="qa">问答型</a-select-option>
                <a-select-option value="analysis">分析型</a-select-option>
                <a-select-option value="monitor">监控型</a-select-option>
                <a-select-option value="prediction">预测型</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="所属行业" name="industry">
              <a-select v-model:value="agentForm.industry" placeholder="请选择所属行业">
                <a-select-option value="manufacturing">制造业</a-select-option>
                <a-select-option value="mining">采矿业</a-select-option>
                <a-select-option value="energy">电力、燃气及水生产和供应业</a-select-option>
                <a-select-option value="logistics">交通运输、仓储和邮政业</a-select-option>
                <a-select-option value="it">信息传输、软件和信息技术服务业</a-select-option>
                <a-select-option value="research">科学研究和技术服务业</a-select-option>
                <a-select-option value="environment">水利、环境和公共设施管理业</a-select-option>
                <a-select-option value="other">其他行业</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="业务领域" name="businessDomain">
              <a-select v-model:value="agentForm.businessDomain" placeholder="请选择业务领域">
                <a-select-option value="operation">经营</a-select-option>
                <a-select-option value="marketing">营销</a-select-option>
                <a-select-option value="production">生产</a-select-option>
                <a-select-option value="quality">质控</a-select-option>
                <a-select-option value="rd">研发</a-select-option>
                <a-select-option value="finance">财务</a-select-option>
                <a-select-option value="hr">人事</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="描述" name="description">
          <a-textarea
            v-model:value="agentForm.description"
            placeholder="请输入描述"
            :rows="2"
          />
        </a-form-item>

        <a-divider>工具与能力配置</a-divider>
        <a-form-item label="可访问知识库" name="knowledgeBases">
          <a-select
            v-model:value="agentForm.knowledgeBases"
            mode="multiple"
            placeholder="请选择知识库"
          >
            <a-select-option value="kb1">通用知识库</a-select-option>
            <a-select-option value="kb2">行业知识库</a-select-option>
            <a-select-option value="kb3">产品知识库</a-select-option>
            <a-select-option value="kb4">企业知识库</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="数据分析能力" name="dataCapabilities">
          <a-checkbox-group v-model:value="agentForm.dataCapabilities">
            <a-checkbox value="basic">基础分析</a-checkbox>
            <a-checkbox value="advanced">高级分析</a-checkbox>
            <a-checkbox value="prediction">预测分析</a-checkbox>
          </a-checkbox-group>
        </a-form-item>

        <a-form-item label="API配置" name="apis">
          <a-table
            :columns="apiColumns"
            :data-source="agentForm.apis"
            size="small"
            :pagination="false"
          >
            <template #bodyCell="{ column }">
              <template v-if="column.key === 'action'">
                <a @click="handleAddApi">添加</a>
              </template>
            </template>
          </a-table>
        </a-form-item>

        <a-divider>运行参数</a-divider>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="温度" name="temperature">
              <a-slider
                v-model:value="agentForm.temperature"
                :min="0"
                :max="1"
                :step="0.1"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="最大Token数" name="maxTokens">
              <a-input-number
                v-model:value="agentForm.maxTokens"
                :min="100"
                :max="4000"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-divider>权限配置</a-divider>
        <a-form-item label="可访问系统" name="allowedSystems">
          <a-select
            v-model:value="agentForm.allowedSystems"
            placeholder="请选择可访问系统"
          >
            <a-select-option value="enterprise_brain">企业大脑服务平台</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="可访问版本" name="allowedVersions">
          <a-select
            v-model:value="agentForm.allowedVersions"
            mode="multiple"
            placeholder="请选择可访问版本"
          >
            <a-select-option value="free">免费版</a-select-option>
            <a-select-option value="basic">基础版</a-select-option>
            <a-select-option value="standard">标准版</a-select-option>
            <a-select-option value="professional">专业版</a-select-option>
            <a-select-option value="enterprise">旗舰版</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="模型选择" name="model">
          <a-select
            v-model:value="agentForm.model"
            placeholder="请选择模型"
          >
            <a-select-option value="deepseek">Deepseek</a-select-option>
            <a-select-option value="qwen">Qwen</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Agent监控抽屉 -->
    <a-drawer
      v-model:visible="monitorDrawerVisible"
      title="Agent监控"
      width="600"
      placement="right"
    >
      <a-tabs v-model:activeKey="monitorActiveKey">
        <a-tab-pane key="stats" tab="统计数据">
          <a-card>
            <a-statistic-group>
              <a-statistic title="调用次数" :value="1128" />
              <a-statistic title="平均响应时间" :value="323" suffix="ms" />
              <a-statistic title="成功率" :value="98.5" suffix="%" />
            </a-statistic-group>
          </a-card>
          <a-card title="调用趋势" class="mt-4">
            <!-- 这里可以放置趋势图表 -->
          </a-card>
        </a-tab-pane>
        <a-tab-pane key="logs" tab="运行日志">
          <a-list
            :data-source="logData"
            :loading="logLoading"
            item-layout="horizontal"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta
                  :description="item.timestamp"
                >
                  <template #title>
                    <span :class="`log-level-${item.level}`">{{ item.message }}</span>
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
        </a-tab-pane>
      </a-tabs>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import type { FormInstance } from 'ant-design-vue'
import { message } from 'ant-design-vue'
import SearchComponent from '../components/SearchComponent.vue'
import type { FilterConfig, SearchField, SortOption, QuickFilter } from '../types/search'

// Agent表格列定义
const agentColumns = [
  {
    title: 'Agent ID',
    dataIndex: 'id',
    key: 'id',
    width: 120,
  },
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name',
    width: 150,
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 120,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 180,
  },
  {
    title: '最近活跃时间',
    dataIndex: 'lastActiveTime',
    key: 'lastActiveTime',
    width: 180,
  },
  {
    title: '处理任务数',
    dataIndex: 'taskCount',
    key: 'taskCount',
    width: 120,
  },
  {
    title: 'Token使用量',
    dataIndex: 'tokenUsage',
    key: 'tokenUsage',
    width: 120,
  },
  {
    title: '操作',
    key: 'action',
    fixed: 'right',
    width: 200,
  },
]

// API配置表格列
const apiColumns = [
  {
    title: 'API名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '地址',
    dataIndex: 'url',
    key: 'url',
  },
  {
    title: '操作',
    key: 'action',
    width: 80,
  },
]

// 模拟数据
const agentData = ref([
  {
    id: 'AGT001',
    name: '智能客服助手',
    type: '对话型',
    status: 'enabled',
    createdAt: '2024-01-15 10:00:00',
    lastActiveTime: '2024-01-18 15:30:22',
    taskCount: 1250,
  },
  {
    id: 'AGT002',
    name: '数据分析专家',
    type: '分析型',
    status: 'enabled',
    createdAt: '2024-01-15 11:30:00',
    lastActiveTime: '2024-01-18 14:45:10',
    taskCount: 856,
  },
  {
    id: 'AGT003',
    name: '文档处理引擎',
    type: '处理型',
    status: 'disabled',
    createdAt: '2024-01-16 09:15:00',
    lastActiveTime: '2024-01-17 18:20:15',
    taskCount: 432,
  },
  {
    id: 'AGT004',
    name: '知识库管理器',
    type: '管理型',
    status: 'enabled',
    createdAt: '2024-01-16 14:20:00',
    lastActiveTime: '2024-01-18 16:10:05',
    taskCount: 678,
  },
  {
    id: 'AGT005',
    name: '任务调度中心',
    type: '调度型',
    status: 'enabled',
    createdAt: '2024-01-17 16:45:00',
    lastActiveTime: '2024-01-18 16:15:30',
    taskCount: 945,
  },
  {
    id: 'AGT006',
    name: '内容审核助手',
    type: '审核型',
    status: 'enabled',
    createdAt: '2024-01-18 09:30:00',
    lastActiveTime: '2024-01-18 16:00:45',
    taskCount: 325,
  },
  {
    id: 'AGT007',
    name: '多模态分析器',
    type: '分析型',
    status: 'enabled',
    createdAt: '2024-01-18 10:15:00',
    lastActiveTime: '2024-01-18 15:55:20',
    taskCount: 156,
  },
])
const loading = ref(false)
const logData = ref([])
const logLoading = ref(false)

// Agent表单相关
const agentModalVisible = ref(false)
const agentModalTitle = ref('新增Agent')
const agentFormRef = ref<FormInstance>()
const agentForm = reactive({
  name: '',
  type: '',
  industry: '',
  description: '',
  knowledgeBases: [] as string[],
  dataCapabilities: [] as string[],
  apis: [] as { name: string; url: string }[],
  temperature: 0.7,
  maxTokens: 2000,
  allowedSystems: '',
  allowedVersions: [] as string[],
  model: '',
  businessDomain: '',
})

const agentRules = {
  name: [{ required: true, message: '请输入Agent名称' }],
  type: [{ required: true, message: '请选择Agent类型' }],
  industry: [{ required: true, message: '请选择所属行业' }],
  knowledgeBases: [{ required: true, message: '请选择可访问的知识库' }],
  allowedSystems: [{ required: true, message: '请选择可访问系统' }],
  allowedVersions: [{ required: true, message: '请选择可访问版本' }],
  model: [{ required: true, message: '请选择模型' }],
}

// 监控相关
const monitorDrawerVisible = ref(false)
const monitorActiveKey = ref('stats')

// 搜索相关配置
const searchFields: SearchField[] = [
  { label: '全部', value: 'all' },
  { label: 'Agent名称', value: 'name' },
  { label: '类型', value: 'type' },
  { label: '行业', value: 'industry' },
  { label: '业务领域', value: 'businessDomain' }
]

const filters: FilterConfig[] = [
  {
    type: 'select',
    label: 'Agent类型',
    field: 'type',
    span: 8,
    options: [
      { label: '问答型', value: 'qa' },
      { label: '分析型', value: 'analysis' },
      { label: '监控型', value: 'monitor' },
      { label: '预测型', value: 'prediction' }
    ]
  },
  {
    type: 'select',
    label: '所属行业',
    field: 'industry',
    span: 8,
    options: [
      { label: '制造业', value: 'manufacturing' },
      { label: '采矿业', value: 'mining' },
      { label: '电力、燃气及水生产和供应业', value: 'energy' },
      { label: '交通运输、仓储和邮政业', value: 'logistics' },
      { label: '信息传输、软件和信息技术服务业', value: 'it' },
      { label: '科学研究和技术服务业', value: 'research' },
      { label: '水利、环境和公共设施管理业', value: 'environment' },
      { label: '其他行业', value: 'other' }
    ]
  },
  {
    type: 'select',
    label: '业务领域',
    field: 'businessDomain',
    span: 8,
    options: [
      { label: '经营', value: 'operation' },
      { label: '营销', value: 'marketing' },
      { label: '生产', value: 'production' },
      { label: '质控', value: 'quality' },
      { label: '研发', value: 'rd' },
      { label: '财务', value: 'finance' },
      { label: '人事', value: 'hr' }
    ]
  },
  {
    type: 'select',
    label: '状态',
    field: 'status',
    span: 8,
    options: [
      { label: '启用', value: 'enabled' },
      { label: '禁用', value: 'disabled' }
    ]
  },
  {
    type: 'dateRange',
    label: '创建时间',
    field: 'createTime',
    span: 8
  },
  {
    type: 'select',
    label: '可访问版本',
    field: 'allowedVersions',
    span: 8,
    options: [
      { label: '免费版', value: 'free' },
      { label: '基础版', value: 'basic' },
      { label: '标准版', value: 'standard' },
      { label: '专业版', value: 'professional' },
      { label: '旗舰版', value: 'enterprise' }
    ],
    mode: 'multiple'
  }
]

const sortOptions: SortOption[] = [
  { label: '创建时间：从新到旧', value: 'createTime,desc' },
  { label: '创建时间：从旧到新', value: 'createTime,asc' },
  { label: '使用频率：从高到低', value: 'useFrequency,desc' },
  { label: '使用频率：从低到高', value: 'useFrequency,asc' }
]

const quickFilters: QuickFilter[] = [
  { label: '已启用', value: { status: 'enabled' }, color: 'green' },
  { label: '已禁用', value: { status: 'disabled' }, color: 'red' },
  { label: '问答型', value: { type: 'qa' }, color: 'blue' },
  { label: '分析型', value: { type: 'analysis' }, color: 'purple' }
]

// 搜索事件处理
const handleSearch = (params: Record<string, any>) => {
  console.log('搜索参数:', params)
  // 调用API获取数据
  loading.value = true
  setTimeout(() => {
    // 模拟API调用
    loading.value = false
  }, 500)
}

// 筛选事件处理
const handleFilter = (params: Record<string, any>) => {
  console.log('筛选参数:', params)
  // 调用API获取数据
  loading.value = true
  setTimeout(() => {
    // 模拟API调用
    loading.value = false
  }, 500)
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

// Agent相关操作
const handleAddAgent = () => {
  agentModalTitle.value = '新增Agent'
  agentModalVisible.value = true
}

const handleEditAgent = (record: any) => {
  agentModalTitle.value = '编辑Agent'
  Object.assign(agentForm, record)
  agentModalVisible.value = true
}

const handleViewAgent = (record: any) => {
  monitorDrawerVisible.value = true
}

const handleToggleStatus = (record: any, checked: boolean) => {
  // 处理Agent状态切换
  message.success(`${record.name} ${checked ? '已启用' : '已禁用'}`)
}

const handleAgentModalOk = () => {
  agentFormRef.value?.validate().then(() => {
    // 处理表单提交
    agentModalVisible.value = false
  })
}

const handleAddApi = () => {
  agentForm.apis.push({
    name: '',
    url: '',
  })
}
</script>

<style lang="less" scoped>
.agent-management {
  padding: 24px;

  .mt-4 {
    margin-top: 16px;
  }

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

  .log-level-error {
    color: #ff4d4f;
  }

  .log-level-warning {
    color: #faad14;
  }

  .log-level-info {
    color: #1890ff;
  }
}
</style>