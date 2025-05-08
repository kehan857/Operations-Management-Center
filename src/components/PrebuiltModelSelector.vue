<template>
  <div class="prebuilt-model-selector">
    <a-row :gutter="16">
      <!-- 左侧模型分类树 -->
      <a-col :span="6">
        <a-card title="模型分类" :bordered="false" class="category-card">
          <a-input
            placeholder="搜索分类"
            v-model:value="categorySearchText"
            class="category-search"
          />
          <a-tree
            :tree-data="filteredCategories"
            :defaultExpandAll="true"
            :selectedKeys="[selectedCategory]"
            @select="handleCategorySelect"
          />
        </a-card>
      </a-col>
      
      <!-- 右侧模型列表和详情 -->
      <a-col :span="18">
        <a-card :bordered="false" class="models-card">
          <!-- 搜索和筛选 -->
          <div class="search-filter">
            <a-input
              placeholder="搜索预建模型（名称、描述、适用场景）"
              v-model:value="modelSearchText"
              class="model-search"
              @change="handleModelSearch"
            >
              <template #prefix>
                <SearchOutlined />
              </template>
            </a-input>
          </div>
          
          <!-- 模型列表 -->
          <div class="model-list">
            <a-list
              :data-source="filteredModels"
              :loading="loading"
              item-layout="horizontal"
            >
              <template #renderItem="{ item }">
                <a-list-item
                  :class="{ 'selected-model': selectedModel?.id === item.id }"
                  @click="handleModelSelect(item)"
                >
                  <a-list-item-meta>
                    <template #title>{{ item.name }}</template>
                    <template #description>{{ item.description }}</template>
                  </a-list-item-meta>
                  <template #extra>
                    <span>{{ getModelTypeName(item.type) }}</span>
                  </template>
                </a-list-item>
              </template>
            </a-list>
          </div>
          
          <!-- 模型详情 -->
          <a-divider v-if="selectedModel">模型详情</a-divider>
          <div v-if="selectedModel" class="model-details">
            <h3>{{ selectedModel.name }}</h3>
            <p class="description">{{ selectedModel.description }}</p>
            
            <a-descriptions title="基本信息" :column="2">
              <a-descriptions-item label="模型类型">{{ getModelTypeName(selectedModel.type) }}</a-descriptions-item>
              <a-descriptions-item label="适用场景">{{ selectedModel.applicableScenarios }}</a-descriptions-item>
              <a-descriptions-item label="版本">{{ selectedModel.version }}</a-descriptions-item>
              <a-descriptions-item label="更新时间">{{ selectedModel.updateTime }}</a-descriptions-item>
            </a-descriptions>
            
            <a-divider>字段结构</a-divider>
            <a-table
              :columns="fieldColumns"
              :data-source="selectedModel.fields"
              :pagination="false"
              size="small"
            ></a-table>
            
            <div class="action-buttons">
              <a-button type="primary" @click="handleUseModel">使用此模型</a-button>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, defineEmits } from 'vue'
import { SearchOutlined } from '@ant-design/icons-vue'

const emit = defineEmits(['use-model'])

const loading = ref(false)
const categorySearchText = ref('')
const modelSearchText = ref('')
const selectedCategory = ref('all')
const selectedModel = ref<any>(null)

// 字段表格列定义
const fieldColumns = [
  { title: '字段名', dataIndex: 'name', key: 'name' },
  { title: '数据类型', dataIndex: 'type', key: 'type' },
  { title: '描述', dataIndex: 'description', key: 'description' }
]

// 模型分类数据
const categories = [
  {
    key: 'all',
    title: '全部',
    children: []
  },
  {
    key: 'business',
    title: '经营管理',
    children: [
      { key: 'finance', title: '财务管理' },
      { key: 'sales', title: '销售管理' }
    ]
  },
  {
    key: 'manufacturing',
    title: '制造业',
    children: [
      { key: 'production', title: '生产管理' },
      { key: 'quality', title: '质量管理' },
      { key: 'supply', title: '供应链管理' }
    ]
  },
  {
    key: 'retail',
    title: '零售业',
    children: [
      { key: 'store', title: '门店管理' },
      { key: 'inventory', title: '库存管理' },
      { key: 'customer', title: '客户管理' }
    ]
  }
]

// 预建模型数据（实际应从API获取）
const prebuiltModels = ref([
  {
    id: 1,
    name: '订单主数据模型',
    description: '标准订单数据模型，包含订单基本信息、客户信息、支付信息等',
    type: 'business',
    category: 'sales',
    applicableScenarios: '销售订单管理、订单分析',
    version: '1.0.0',
    updateTime: '2024-03-15',
    fields: [
      { name: 'order_id', type: 'string', description: '订单唯一标识' },
      { name: 'customer_id', type: 'string', description: '客户ID' },
      { name: 'order_time', type: 'datetime', description: '下单时间' },
      { name: 'amount', type: 'decimal', description: '订单金额' },
      { name: 'status', type: 'string', description: '订单状态' },
      { name: 'payment_method', type: 'string', description: '支付方式' }
    ]
  },
  {
    id: 2,
    name: '产品主数据模型',
    description: '标准产品数据模型，包含产品基本信息、分类、价格等',
    type: 'business',
    category: 'sales',
    applicableScenarios: '产品管理、库存管理',
    version: '1.0.0',
    updateTime: '2024-03-20',
    fields: [
      { name: 'product_id', type: 'string', description: '产品唯一标识' },
      { name: 'name', type: 'string', description: '产品名称' },
      { name: 'category_id', type: 'string', description: '产品分类ID' },
      { name: 'price', type: 'decimal', description: '产品价格' },
      { name: 'cost', type: 'decimal', description: '产品成本' },
      { name: 'status', type: 'string', description: '产品状态' }
    ]
  },
  {
    id: 3,
    name: '生产计划模型',
    description: '生产计划数据模型，包含计划信息、资源需求、时间安排等',
    type: 'manufacturing',
    category: 'production',
    applicableScenarios: '生产计划管理、资源分配',
    version: '1.0.0',
    updateTime: '2024-02-10',
    fields: [
      { name: 'plan_id', type: 'string', description: '计划唯一标识' },
      { name: 'product_id', type: 'string', description: '产品ID' },
      { name: 'quantity', type: 'integer', description: '计划生产数量' },
      { name: 'start_date', type: 'date', description: '计划开始日期' },
      { name: 'end_date', type: 'date', description: '计划结束日期' },
      { name: 'status', type: 'string', description: '计划状态' }
    ]
  },
  {
    id: 4,
    name: '库存管理模型',
    description: '库存数据模型，包含库存基本信息、位置、状态等',
    type: 'retail',
    category: 'inventory',
    applicableScenarios: '库存管理、库存分析',
    version: '1.0.0',
    updateTime: '2024-04-01',
    fields: [
      { name: 'inventory_id', type: 'string', description: '库存记录唯一标识' },
      { name: 'product_id', type: 'string', description: '产品ID' },
      { name: 'warehouse_id', type: 'string', description: '仓库ID' },
      { name: 'quantity', type: 'integer', description: '库存数量' },
      { name: 'unit_cost', type: 'decimal', description: '单位成本' },
      { name: 'updated_at', type: 'datetime', description: '最后更新时间' }
    ]
  }
])

// 根据分类筛选
const filteredCategories = computed(() => {
  if (!categorySearchText.value) return categories
  
  const search = (items) => {
    return items.filter(item => {
      const match = item.title.toLowerCase().includes(categorySearchText.value.toLowerCase())
      const childMatches = item.children && item.children.length > 0 
        ? search(item.children) 
        : []
      
      return match || childMatches.length > 0
    })
  }
  
  return search(categories)
})

// 根据搜索条件筛选模型
const filteredModels = computed(() => {
  const category = selectedCategory.value
  let result = prebuiltModels.value
  
  // 按分类筛选
  if (category && category !== 'all') {
    result = result.filter(model => 
      model.category === category || 
      model.type === category
    )
  }
  
  // 按搜索文本筛选
  if (modelSearchText.value) {
    const searchText = modelSearchText.value.toLowerCase()
    result = result.filter(model => 
      model.name.toLowerCase().includes(searchText) ||
      model.description.toLowerCase().includes(searchText) ||
      model.applicableScenarios.toLowerCase().includes(searchText)
    )
  }
  
  return result
})

// 类型名称转换
const getModelTypeName = (type) => {
  const typeMap = {
    'business': '经营管理',
    'manufacturing': '制造业',
    'retail': '零售业'
  }
  return typeMap[type] || type
}

// 处理分类选择
const handleCategorySelect = (selectedKeys) => {
  if (selectedKeys.length > 0) {
    selectedCategory.value = selectedKeys[0]
  }
}

// 处理模型搜索
const handleModelSearch = () => {
  // 搜索逻辑在计算属性中处理
}

// 处理模型选择
const handleModelSelect = (model) => {
  selectedModel.value = model
}

// 处理使用此模型
const handleUseModel = () => {
  if (selectedModel.value) {
    emit('use-model', selectedModel.value)
  }
}
</script>

<style scoped>
.prebuilt-model-selector {
  height: 600px;
  overflow: hidden;
}

.category-card {
  height: 600px;
  overflow-y: auto;
}

.category-search {
  margin-bottom: 16px;
}

.models-card {
  height: 600px;
  display: flex;
  flex-direction: column;
}

.search-filter {
  margin-bottom: 16px;
}

.model-list {
  flex: 0 0 200px;
  overflow-y: auto;
  border: 1px solid #f0f0f0;
  border-radius: 2px;
  margin-bottom: 16px;
}

.selected-model {
  background-color: #e6f7ff;
}

.model-details {
  flex: 1;
  overflow-y: auto;
}

.description {
  color: #666;
  margin-bottom: 16px;
}

.action-buttons {
  margin-top: 24px;
  text-align: right;
}
</style> 