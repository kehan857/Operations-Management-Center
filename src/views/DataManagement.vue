<template>
  <div class="data-management">
    <a-page-header
      title="数据管理平台"
      sub-title="管理企业数据的全生命周期，构建统一、高质量、安全可信的数据基础"
    />

    <a-tabs v-model:activeKey="activeKey" class="data-tabs">
      <a-tab-pane key="metrics" tab="标准指标体系管理">
        <div class="metrics-system">
          <a-card>
            <div class="card-content">
              <div class="header-actions">
                <div class="search-wrapper">
                  <SearchComponent 
                    :search-fields="metricsSearchFields"
                    :filters="metricsFilters"
                    :sort-options="metricsSortOptions"
                    :quick-filters="metricsQuickFilters"
                    :enable-export="true"
                    @search="handleMetricsSearch"
                    @filter="handleMetricsFilter"
                    @export="handleMetricsExport"
                    @save-filter="handleSaveFilter"
                    class="custom-search-component"
                  />
                </div>
                <div class="action-wrapper">
                  <a-button type="primary" class="add-button" @click="handleAddMetric">
                    <template #icon><PlusOutlined /></template>
                    新增指标
                  </a-button>
                </div>
              </div>
            </div>

            <a-table
              :columns="metricsColumns"
              :data-source="metricsData"
              :loading="loading"
              rowKey="id"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'action'">
                  <a-space>
                    <a @click="handleEditMetric(record)">编辑</a>
                    <a-divider type="vertical" />
                    <a @click="handleViewMetric(record)">查看</a>
                  </a-space>
                </template>
              </template>
            </a-table>
          </a-card>
        </div>
      </a-tab-pane>

      <a-tab-pane key="models" tab="数据模型管理">
        <div class="data-models">
          <a-card>
            <div class="card-content">
              <div class="header-actions">
                <div class="search-wrapper">
                  <SearchComponent 
                    :search-fields="modelsSearchFields"
                    :filters="modelsFilters"
                    :sort-options="modelsSortOptions"
                    :quick-filters="modelsQuickFilters"
                    :enable-export="true"
                    @search="handleModelsSearch"
                    @filter="handleModelsFilter"
                    @export="handleModelsExport"
                    @save-filter="handleSaveFilter"
                    class="custom-search-component"
                  />
                </div>
                <div class="action-wrapper">
                  <a-dropdown>
                    <a-button type="primary" class="add-button">
                      <template #icon><PlusOutlined /></template>
                      新增数据模型
                      <template #suffix><DownOutlined /></template>
                    </a-button>
                    <template #overlay>
                      <a-menu>
                        <a-menu-item key="blank" @click="handleAddBlankModel">
                          <FormOutlined /> 新建空白模型
                        </a-menu-item>
                        <a-menu-item key="prebuilt" @click="handleSelectPrebuiltModel">
                          <AppstoreOutlined /> 选择预建模型
                        </a-menu-item>
                      </a-menu>
                    </template>
                  </a-dropdown>
                </div>
              </div>
            </div>

            <a-table
              :columns="modelsColumns"
              :data-source="modelsData"
              :loading="loading"
              rowKey="id"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'action'">
                  <a-space>
                    <a @click="handleEditModel(record)">编辑</a>
                    <a-divider type="vertical" />
                    <a @click="handleViewModel(record)">查看</a>
                    <a-divider type="vertical" />
                    <a @click="handleMapModel(record)">指标映射</a>
                  </a-space>
                </template>
              </template>
            </a-table>
          </a-card>
        </div>
      </a-tab-pane>
    </a-tabs>

    <!-- 指标编辑弹窗 -->
    <!-- 数据模型编辑弹窗 -->
    <a-modal
      v-model:visible="modelModalVisible"
      :title="modelModalTitle"
      @ok="handleModelModalOk"
      width="800px"
    >
      <DataModelEditor
        ref="modelEditorRef"
        :initial-data="currentModel"
      />
    </a-modal>

    <!-- 数据模型映射弹窗 -->
    <a-modal
      v-model:visible="modelMappingVisible"
      title="指标映射配置"
      @ok="handleModelMappingOk"
      width="1000px"
    >
      <DataModelMapping
        :model-fields="currentModel?.fields || []"
        @update:mapping="handleMappingUpdate"
      />
    </a-modal>

    <!-- 指标编辑弹窗 -->
    <a-modal
      v-model:visible="metricModalVisible"
      :title="metricModalTitle"
      @ok="handleMetricModalOk"
    >
      <a-form
        :model="metricForm"
        :rules="metricRules"
        ref="metricFormRef"
        layout="vertical"
      >
        <a-form-item label="行业/业务域" name="businessDomain">
          <a-cascader
            v-model:value="metricForm.businessDomain"
            :options="businessDomainOptions"
            placeholder="请选择行业/业务域"
          />
        </a-form-item>
        <a-form-item label="指标名称" name="name" required>
          <a-input v-model:value="metricForm.name" placeholder="请输入指标名称" />
        </a-form-item>
        <a-form-item label="指标编码" name="code" required>
          <a-input v-model:value="metricForm.code" placeholder="请输入指标编码" />
        </a-form-item>
        <a-form-item label="指标类型" name="metricType" required>
          <a-select
            v-model:value="metricForm.metricType"
            mode="multiple"
            placeholder="请选择指标类型"
          >
            <a-select-option value="business">经营</a-select-option>
            <a-select-option value="marketing">营销</a-select-option>
            <a-select-option value="production">生产</a-select-option>
            <a-select-option value="quality">质控</a-select-option>
            <a-select-option value="research">研发</a-select-option>
            <a-select-option value="finance">财务</a-select-option>
            <a-select-option value="hr">人事</a-select-option>
            <a-select-option value="other">其他</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="业务定义" name="description" required>
          <a-textarea
            v-model:value="metricForm.description"
            placeholder="请输入指标的业务含义和上下文"
            :rows="4"
          />
        </a-form-item>
        <a-form-item label="指标结构类型" name="structureType" required>
          <a-select
            v-model:value="metricForm.structureType"
            placeholder="请选择指标结构类型"
            @change="handleStructureTypeChange"
          >
            <a-select-option value="atomic">原子指标</a-select-option>
            <a-select-option value="composite">复合指标</a-select-option>
            <a-select-option value="derived">派生指标</a-select-option>
          </a-select>
        </a-form-item>
        
        <!-- 原子指标特有字段 -->
        <template v-if="metricForm.structureType === 'atomic'">
          <a-form-item label="数据来源" name="dataSource" required>
            <a-select
              v-model:value="metricForm.dataSource"
              placeholder="请选择数据来源"
            >
              <a-select-option value="model">数据模型</a-select-option>
              <a-select-option value="collection">数据采集</a-select-option>
              <a-select-option value="manual">手动描述</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="聚合函数" name="aggregateFunction">
            <a-select
              v-model:value="metricForm.aggregateFunction"
              placeholder="请选择聚合函数"
            >
              <a-select-option value="sum">SUM (求和)</a-select-option>
              <a-select-option value="avg">AVG (平均)</a-select-option>
              <a-select-option value="count">COUNT (计数)</a-select-option>
              <a-select-option value="distinct">COUNT DISTINCT (去重计数)</a-select-option>
              <a-select-option value="max">MAX (最大值)</a-select-option>
              <a-select-option value="min">MIN (最小值)</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="统计维度" name="dimensions">
            <a-select
              v-model:value="metricForm.dimensions"
              mode="multiple"
              placeholder="请选择统计维度"
            >
              <a-select-option value="order">订单ID</a-select-option>
              <a-select-option value="customer">客户ID</a-select-option>
              <a-select-option value="date">日期</a-select-option>
              <a-select-option value="product">产品类别</a-select-option>
            </a-select>
          </a-form-item>
        </template>

        <!-- 复合指标特有字段 -->
        <template v-if="metricForm.structureType === 'composite'">
          <a-form-item label="构成指标" name="compositeMetrics" required>
            <a-select
              v-model:value="metricForm.compositeMetrics"
              mode="multiple"
              placeholder="请选择构成指标"
            >
              <a-select-option
                v-for="metric in availableMetrics"
                :key="metric.code"
                :value="metric.code"
              >
                {{ metric.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="计算公式" name="formula" required>
            <a-textarea
              v-model:value="metricForm.formula"
              placeholder="请输入计算公式，使用选定的构成指标作为变量"
              :rows="4"
            />
          </a-form-item>
          <a-form-item label="数据源整合说明" name="dataSourceIntegration">
            <a-textarea
              v-model:value="metricForm.dataSourceIntegration"
              placeholder="请说明如何对齐来自不同构成指标源的数据"
              :rows="3"
            />
          </a-form-item>
        </template>

        <!-- 派生指标特有字段 -->
        <template v-if="metricForm.structureType === 'derived'">
          <a-form-item label="基础指标" name="baseMetrics" required>
            <a-select
              v-model:value="metricForm.baseMetrics"
              mode="multiple"
              placeholder="请选择基础指标"
            >
              <a-select-option
                v-for="metric in availableMetrics"
                :key="metric.code"
                :value="metric.code"
              >
                {{ metric.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="派生参数配置" name="derivationConfig" required>
            <a-form layout="vertical">
              <a-form-item label="比较类型">
                <a-select
                  v-model:value="metricForm.derivationConfig.compareType"
                  placeholder="请选择比较类型"
                >
                  <a-select-option value="mom">环比</a-select-option>
                  <a-select-option value="yoy">同比</a-select-option>
                  <a-select-option value="target">目标比</a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item label="时间窗口">
                <a-input-number
                  v-model:value="metricForm.derivationConfig.timeWindow"
                  placeholder="请输入时间偏移量"
                />
              </a-form-item>
            </a-form>
          </a-form-item>
        </template>

        <a-form-item label="计量单位" name="unit" required>
          <a-select v-model:value="metricForm.unit" placeholder="请选择计量单位">
            <a-select-option value="yuan">元</a-select-option>
            <a-select-option value="percent">%</a-select-option>
            <a-select-option value="times">次/年</a-select-option>
            <a-select-option value="days">天</a-select-option>
            <a-select-option value="count">个</a-select-option>
            <a-select-option value="person">人</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="数据类型" name="dataType" required>
          <a-select v-model:value="metricForm.dataType" placeholder="请选择数据类型">
            <a-select-option value="decimal">小数</a-select-option>
            <a-select-option value="integer">整数</a-select-option>
            <a-select-option value="percentage">百分比</a-select-option>
            <a-select-option value="currency">货币</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="默认时间周期" name="timePeriod">
          <a-select v-model:value="metricForm.timePeriod" placeholder="请选择默认时间周期">
            <a-select-option value="daily">每日</a-select-option>
            <a-select-option value="monthly">月度</a-select-option>
            <a-select-option value="quarterly">季度</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="解释说明" name="explanation">
          <a-textarea
            v-model:value="metricForm.explanation"
            placeholder="请输入额外的背景信息、注意事项、计算细节等"
            :rows="3"
          />
        </a-form-item>
        <a-form-item label="状态" name="status" required>
          <a-select v-model:value="metricForm.status" placeholder="请选择状态">
            <a-select-option value="draft">草稿</a-select-option>
            <a-select-option value="active">已激活</a-select-option>
            <a-select-option value="deprecated">已弃用</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="负责人" name="owner" required>
          <a-select
            v-model:value="metricForm.owner"
            placeholder="请选择负责人"
            show-search
          >
            <a-select-option
              v-for="user in userList"
              :key="user.id"
              :value="user.id"
            >
              {{ user.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 预建模型选择器弹窗 -->
    <a-modal
      v-model:visible="prebuiltModelSelectorVisible"
      title="选择预建数据模型"
      width="800px"
      @ok="() => prebuiltModelSelectorVisible = false"
    >
      <PrebuiltModelSelector
        @use-model="handlePrebuiltModelSelected"
      />
    </a-modal>

  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, watch } from 'vue'
import { PlusOutlined, DownOutlined, FormOutlined, AppstoreOutlined } from '@ant-design/icons-vue'
import type { FormInstance } from 'ant-design-vue'
import DataModelEditor from '../components/DataModelEditor.vue'
import DataModelMapping from '../components/DataModelMapping.vue'
import SearchComponent from '../components/SearchComponent.vue'
import PrebuiltModelSelector from '../components/PrebuiltModelSelector.vue'
import type { FilterConfig, SearchField, SortOption, QuickFilter } from '../types/search'
import type { DataModel, PrebuiltModel, ModelField } from '../types/model'

// 标签页激活key
const activeKey = ref('metrics')

// 加载状态
const loading = ref(false)

// 行业/业务域选项
const businessDomainOptions = [
  {
    value: 'finance',
    label: '金融',
    children: [
      { value: 'investment', label: '投资理财' },
      { value: 'banking', label: '银行业务' },
      { value: 'insurance', label: '保险服务' }
    ]
  },
  {
    value: 'retail',
    label: '零售',
    children: [
      { value: 'online', label: '线上零售' },
      { value: 'offline', label: '线下零售' },
      { value: 'omni', label: '全渠道' }
    ]
  },
  {
    value: 'manufacturing',
    label: '制造',
    children: [
      { value: 'supply_chain', label: '供应链' },
      { value: 'production', label: '生产制造' },
      { value: 'quality', label: '质量管理' }
    ]
  }
]

// 可用指标列表
const availableMetrics = ref<Array<{
  code: string;
  name: string;
  status?: string;
}>>([])

// 用户列表
const userList = ref([])

// 指标表单引用
const metricFormRef = ref<FormInstance>()

// 指标表单数据
const metricForm = reactive({
  businessDomain: [],
  name: '',
  code: '',
  metricType: [],
  description: '',
  structureType: '',
  dataSource: '',
  aggregateFunction: '',
  dimensions: [],
  compositeMetrics: [],
  formula: '',
  dataSourceIntegration: '',
  baseMetrics: [],
  derivationConfig: {
    compareType: '',
    timeWindow: null
  },
  unit: '',
  dataType: '',
  timePeriod: '',
  explanation: '',
  status: 'draft',
  owner: ''
})

// 指标表单验证规则
const metricRules = {
  businessDomain: [{ required: true, message: '请选择行业/业务域', trigger: 'change' }],
  name: [{ required: true, message: '请输入指标名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入指标编码', trigger: 'blur' }],
  metricType: [{ required: true, type: 'array', message: '请选择至少一个指标类型', trigger: 'change' }],
  description: [{ required: true, message: '请输入业务定义', trigger: 'blur' }],
  structureType: [{ required: true, message: '请选择指标结构类型', trigger: 'change' }],
  unit: [{ required: true, message: '请选择计量单位', trigger: 'change' }],
  dataType: [{ required: true, message: '请选择数据类型', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  owner: [{ required: true, message: '请选择负责人', trigger: 'change' }]
}

// 指标相关方法
const metricModalVisible = ref(false)
const metricModalTitle = ref('')
const currentMetric = ref(null)

// 数据模型相关
const modelModalVisible = ref(false)
const modelModalTitle = ref('')
const modelEditorRef = ref<InstanceType<typeof DataModelEditor>>()
const modelMappingVisible = ref(false)
const currentModel = ref<DataModel | null>(null)

// 预建模型选择器相关
const prebuiltModelSelectorVisible = ref(false)

// 搜索相关配置
// 指标搜索配置
const metricsSearchFields: SearchField[] = [
  { label: '全部', value: 'all' },
  { label: '指标名称', value: 'name' },
  { label: '指标编码', value: 'code' },
  { label: '业务定义', value: 'description' },
  { label: '负责人', value: 'owner' }
]

const metricsFilters: FilterConfig[] = [
  {
    type: 'select',
    label: '行业/业务域',
    field: 'businessDomain',
    span: 8,
    options: [
      { label: '经营', value: 'business' },
      { label: '营销', value: 'marketing' },
      { label: '生产', value: 'production' },
      { label: '质控', value: 'quality' },
      { label: '研发', value: 'research' },
      { label: '财务', value: 'finance' },
      { label: '人事', value: 'hr' },
      { label: '其他', value: 'other' }
    ],
    mode: 'multiple'
  },
  {
    type: 'select',
    label: '指标结构类型',
    field: 'structureType',
    span: 8,
    options: [
      { label: '原子指标', value: 'atomic' },
      { label: '复合指标', value: 'composite' },
      { label: '派生指标', value: 'derived' }
    ]
  },
  {
    type: 'select',
    label: '状态',
    field: 'status',
    span: 8,
    options: [
      { label: '激活', value: 'active' },
      { label: '草稿', value: 'draft' },
      { label: '已停用', value: 'disabled' }
    ]
  },
  {
    type: 'dateRange',
    label: '创建时间',
    field: 'createTime',
    span: 8
  },
  {
    type: 'input',
    label: '负责人',
    field: 'owner',
    span: 8,
    placeholder: '请输入负责人姓名'
  }
]

const metricsSortOptions: SortOption[] = [
  { label: '创建时间：从新到旧', value: 'createTime,desc' },
  { label: '创建时间：从旧到新', value: 'createTime,asc' },
  { label: '指标名称：A-Z', value: 'name,asc' },
  { label: '指标名称：Z-A', value: 'name,desc' }
]

const metricsQuickFilters: QuickFilter[] = [
  { label: '已激活', value: { status: 'active' }, color: 'green' },
  { label: '草稿', value: { status: 'draft' }, color: 'orange' },
  { label: '原子指标', value: { structureType: 'atomic' }, color: 'blue' },
  { label: '复合指标', value: { structureType: 'composite' }, color: 'purple' }
]

// 数据模型搜索配置
const modelsSearchFields: SearchField[] = [
  { label: '全部', value: 'all' },
  { label: '模型名称', value: 'name' },
  { label: '模型编码', value: 'code' },
  { label: '描述', value: 'description' },
  { label: '字段名称', value: 'fieldName' }
]

const modelsFilters: FilterConfig[] = [
  {
    type: 'select',
    label: '模型类型',
    field: 'modelType',
    span: 8,
    options: [
      { label: '事实表', value: 'fact' },
      { label: '维度表', value: 'dimension' }
    ]
  },
  {
    type: 'select',
    label: '所属业务域',
    field: 'businessDomain',
    span: 8,
    options: [
      { label: '经营', value: 'business' },
      { label: '营销', value: 'marketing' },
      { label: '生产', value: 'production' },
      { label: '质控', value: 'quality' },
      { label: '研发', value: 'research' },
      { label: '财务', value: 'finance' },
      { label: '人事', value: 'hr' },
      { label: '其他', value: 'other' }
    ]
  },
  {
    type: 'select',
    label: '状态',
    field: 'status',
    span: 8,
    options: [
      { label: '激活', value: 'active' },
      { label: '草稿', value: 'draft' },
      { label: '已停用', value: 'disabled' }
    ]
  },
  {
    type: 'numberRange',
    label: '关联指标数',
    field: 'metricCount',
    span: 8
  },
  {
    type: 'dateRange',
    label: '创建时间',
    field: 'createTime',
    span: 8
  }
]

const modelsSortOptions: SortOption[] = [
  { label: '创建时间：从新到旧', value: 'createTime,desc' },
  { label: '创建时间：从旧到新', value: 'createTime,asc' },
  { label: '关联指标数：从多到少', value: 'metricCount,desc' },
  { label: '关联指标数：从少到多', value: 'metricCount,asc' }
]

const modelsQuickFilters: QuickFilter[] = [
  { label: '已激活', value: { status: 'active' }, color: 'green' },
  { label: '草稿', value: { status: 'draft' }, color: 'orange' },
  { label: '事实表', value: { modelType: 'fact' }, color: 'blue' },
  { label: '维度表', value: { modelType: 'dimension' }, color: 'purple' }
]

// 搜索相关处理函数
// 指标搜索处理
const handleMetricsSearch = (params: Record<string, any>) => {
  console.log('指标搜索参数:', params)
  // 调用API获取数据
  loading.value = true
  setTimeout(() => {
    // 模拟API调用
    loading.value = false
  }, 500)
}

const handleMetricsFilter = (params: Record<string, any>) => {
  console.log('指标筛选参数:', params)
  // 调用API获取数据
  loading.value = true
  setTimeout(() => {
    // 模拟API调用
    loading.value = false
  }, 500)
}

const handleMetricsExport = (params: Record<string, any>) => {
  console.log('指标导出参数:', params)
  // 调用API导出数据
}

// 数据模型搜索处理
const handleModelsSearch = (params: Record<string, any>) => {
  console.log('数据模型搜索参数:', params)
  // 调用API获取数据
  loading.value = true
  setTimeout(() => {
    // 模拟API调用
    loading.value = false
  }, 500)
}

const handleModelsFilter = (params: Record<string, any>) => {
  console.log('数据模型筛选参数:', params)
  // 调用API获取数据
  loading.value = true
  setTimeout(() => {
    // 模拟API调用
    loading.value = false
  }, 500)
}

const handleModelsExport = (params: Record<string, any>) => {
  console.log('数据模型导出参数:', params)
  // 调用API导出数据
}

// 保存筛选条件
const handleSaveFilter = (filter: Record<string, any>) => {
  console.log('保存筛选条件:', filter)
  // 保存筛选条件
}

// 观察激活的标签页变化
watch(activeKey, (newKey) => {
  console.log('当前选中标签页:', newKey)
  // 可以根据不同标签页加载不同数据
})

// 获取指标列表数据
const fetchMetricsData = async () => {
  loading.value = true
  try {
    // TODO: 调用API获取指标列表
    metricsData.value = []
  } catch (error) {
    console.error('获取指标列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取可用指标列表
const fetchAvailableMetrics = async () => {
  try {
    // TODO: 调用API获取可用的激活状态指标
    availableMetrics.value = []
  } catch (error) {
    console.error('获取可用指标列表失败:', error)
  }
}

// 获取用户列表
const fetchUserList = async () => {
  try {
    // TODO: 调用API获取用户列表
    userList.value = []
  } catch (error) {
    console.error('获取用户列表失败:', error)
  }
}

// 处理新增指标
const handleAddMetric = () => {
  metricModalTitle.value = '新增指标'
  currentMetric.value = null
  Object.keys(metricForm).forEach(key => {
    if (typeof metricForm[key] === 'object' && !Array.isArray(metricForm[key])) {
      Object.keys(metricForm[key]).forEach(subKey => {
        metricForm[key][subKey] = null
      })
    } else {
      metricForm[key] = Array.isArray(metricForm[key]) ? [] : ''
    }
  })
  metricForm.status = 'draft'
  metricModalVisible.value = true
}

// 处理查看指标
const handleViewMetric = (record) => {
  // TODO: 实现查看详情逻辑
}

// 处理指标结构类型变更
const handleStructureTypeChange = (value) => {
  // 清空相关字段
  switch (value) {
    case 'atomic':
      metricForm.compositeMetrics = []
      metricForm.baseMetrics = []
      metricForm.derivationConfig = { compareType: '', timeWindow: null }
      break
    case 'composite':
      metricForm.dataSource = ''
      metricForm.aggregateFunction = ''
      metricForm.dimensions = []
      metricForm.baseMetrics = []
      metricForm.derivationConfig = { compareType: '', timeWindow: null }
      break
    case 'derived':
      metricForm.dataSource = ''
      metricForm.aggregateFunction = ''
      metricForm.dimensions = []
      metricForm.compositeMetrics = []
      break
  }
}

// 处理指标表单提交
const handleMetricModalOk = async () => {
  if (!metricFormRef.value) return
  
  try {
    await metricFormRef.value.validate()
    
    // 业务规则验证
    if (metricForm.structureType === 'atomic' && metricForm.dataSource === 'model') {
      if (!metricForm.dimensions.length) {
        throw new Error('原子指标必须选择至少一个统计维度')
      }
    }
    
    if (metricForm.structureType === 'composite' && metricForm.compositeMetrics.length < 2) {
      throw new Error('复合指标必须选择至少两个构成指标')
    }
    
    if (metricForm.structureType === 'derived' && !metricForm.baseMetrics.length) {
      throw new Error('派生指标必须选择至少一个基础指标')
    }
    
    if (metricForm.status === 'active') {
      // 检查引用的指标是否都是激活状态
      const referencedMetrics = [...metricForm.compositeMetrics, ...metricForm.baseMetrics]
      const inactiveMetrics = referencedMetrics.filter(m => {
        const metric = availableMetrics.value.find(am => am.code === m)
        return metric && metric.status !== 'active'
      })
      if (inactiveMetrics.length) {
        throw new Error('无法激活指标：引用的指标中存在非激活状态的指标')
      }
    }
    
    // TODO: 调用API保存指标
    if (currentMetric.value) {
      // 编辑模式
      if (currentMetric.value.status === 'active' && metricForm.status === 'active') {
        // 需要创建新版本
      }
    }
    
    metricModalVisible.value = false
    fetchMetricsData()
  } catch (error) {
    console.error('保存指标失败:', error)
    // 显示错误提示
  }
}

// 指标表格列定义
const metricsColumns = [
  {
    title: '指标名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '指标编码',
    dataIndex: 'code',
    key: 'code',
  },
  {
    title: '所属行业/业务域',
    dataIndex: 'businessDomain',
    key: 'businessDomain',
  },
  {
    title: '指标类型',
    dataIndex: 'metricType',
    key: 'metricType',
  },
  {
    title: '指标结构',
    dataIndex: 'structureType',
    key: 'structureType',
  },
  {
    title: '计量单位',
    dataIndex: 'unit',
    key: 'unit',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: '负责人',
    dataIndex: 'owner',
    key: 'owner',
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
  },
]

// 数据模型表格列定义
const modelsColumns = [
  {
    title: '模型名称',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: '行业/业务域',
    dataIndex: 'businessDomain',
    key: 'businessDomain'
  },
  {
    title: '模型类型',
    dataIndex: 'modelType',
    key: 'modelType',
    customRender: ({ text }) => {
      const typeMap = {
        business: '经营',
        marketing: '营销',
        production: '生产',
        quality: '质控',
        research: '研发',
        finance: '财务',
        hr: '人事',
        other: '其他'
      }
      return typeMap[text] || text
    }
  },
  {
    title: '字段数量',
    dataIndex: 'fieldCount',
    key: 'fieldCount'
  },
  {
    title: '已映射指标数',
    dataIndex: 'mappedMetrics',
    key: 'mappedMetrics'
  },
  {
    title: '操作',
    key: 'action',
    width: 200
  }
]

// 模拟数据
const metricsData = ref([
  {
    id: 1,
    name: '资产负债率',
    code: 'FIN_001',
    industry: 'finance',
    createTime: '2024-01-15',
  },
  {
    id: 2,
    name: '存货周转率',
    code: 'RET_001',
    industry: 'retail',
    createTime: '2024-01-16',
  },
  {
    id: 3,
    name: '生产效率',
    code: 'MFG_001',
    industry: 'manufacturing',
    createTime: '2024-01-17',
  },
])
const modelsData = ref([
  {
    id: 1,
    name: '订单主表',
    businessDomain: ['retail', 'sales'],
    fieldCount: 8,
    mappedMetrics: 3,
    fields: [
      { name: 'order_amount', type: 'decimal', description: '订单金额', metricMapping: 'revenue' },
      { name: 'order_cost', type: 'decimal', description: '订单成本', metricMapping: 'cost' },
      { name: 'order_profit', type: 'decimal', description: '订单利润', metricMapping: 'profit' }
    ]
  }
])

// 指标表单相关
Object.assign(metricForm, {
  industry: '',
  name: '',
  code: '',
  description: '',
  formula: '',
})

// 数据模型表单相关
const modelFormRef = ref<FormInstance>()
const modelForm = reactive({
  name: '',
  type: '',
  description: '',
})
const modelRules = {
  name: [{ required: true, message: '请输入模型名称' }],
  type: [{ required: true, message: '请选择模型类型' }],
}


const handleEditMetric = (record: any) => {
  metricModalTitle.value = '编辑指标'
  Object.assign(metricForm, record)
  metricModalVisible.value = true
}

// 数据模型相关操作
const handleAddBlankModel = () => {
  currentModel.value = null
  modelModalTitle.value = '新增数据模型'
  modelModalVisible.value = true
}

const handleSelectPrebuiltModel = () => {
  prebuiltModelSelectorVisible.value = true
}

const handlePrebuiltModelSelected = (model: PrebuiltModel) => {
  // 将预建模型转换为当前系统的数据模型格式
  currentModel.value = {
    name: model.name,
    businessDomain: model.type === 'business' ? ['business'] : [model.type, model.category],
    modelType: model.type,
    description: model.description,
    fields: model.fields.map(field => ({
      name: field.name,
      type: field.type,
      description: field.description,
      metricMapping: '',
      exceptionHandling: '',
      specialScenarios: ''
    }))
  }
  
  prebuiltModelSelectorVisible.value = false
  modelModalTitle.value = '编辑预建数据模型'
  modelModalVisible.value = true
}

const handleEditModel = (record: DataModel) => {
  currentModel.value = { ...record }
  modelModalTitle.value = '编辑数据模型'
  modelModalVisible.value = true
}

const handleViewModel = (record: DataModel) => {
  currentModel.value = { ...record }
  modelModalTitle.value = '查看数据模型'
  modelModalVisible.value = true
}

const handleMapModel = (record: DataModel) => {
  currentModel.value = { ...record }
  modelMappingVisible.value = true
}

const handleModelModalOk = async () => {
  try {
    // 保存数据模型
    modelModalVisible.value = false
  } catch (error) {
    console.error('保存数据模型失败:', error)
  }
}

const handleModelMappingOk = async () => {
  try {
    // 保存映射关系
    modelMappingVisible.value = false
  } catch (error) {
    console.error('保存映射关系失败:', error)
  }
}

const handleMappingUpdate = (mappings: any[]) => {
  if (currentModel.value) {
    currentModel.value.fields = mappings
  }
}


</script>

<style lang="less" scoped>
.data-management {
  padding: 24px;
  
  .data-tabs {
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
}
</style>