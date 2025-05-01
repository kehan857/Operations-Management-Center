<template>
  <div class="data-model-editor">
    <a-form :model="modelForm" :rules="modelRules" ref="modelFormRef" layout="vertical">
      <!-- 基本信息 -->
      <a-form-item label="模型名称" name="name" required>
        <a-input v-model:value="modelForm.name" placeholder="请输入数据模型名称" />
      </a-form-item>
      
      <a-form-item label="行业/业务域" name="businessDomain" required>
        <a-cascader
          v-model:value="modelForm.businessDomain"
          :options="businessDomainOptions"
          placeholder="请选择行业/业务域"
        />
      </a-form-item>

      <a-form-item label="模型类型" name="modelType" required>
        <a-select v-model:value="modelForm.modelType" placeholder="请选择模型类型">
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

      <a-form-item label="模型描述" name="description">
        <a-textarea
          v-model:value="modelForm.description"
          placeholder="请输入模型描述"
          :rows="3"
        />
      </a-form-item>

      <!-- 字段定义 -->
      <a-divider>字段定义</a-divider>
      
      <div class="field-list">
        <a-space direction="vertical" style="width: 100%">
          <a-card v-for="(field, index) in modelForm.fields" :key="index" size="small">
            <template #extra>
              <a-button type="link" danger @click="removeField(index)">
                <DeleteOutlined />
              </a-button>
            </template>

            <a-row :gutter="16">
              <a-col :span="8">
                <a-form-item
                  :name="['fields', index, 'name']"
                  label="字段名"
                  required
                >
                  <a-input v-model:value="field.name" placeholder="请输入字段名" />
                </a-form-item>
              </a-col>
              
              <a-col :span="8">
                <a-form-item
                  :name="['fields', index, 'type']"
                  label="数据类型"
                  required
                >
                  <a-select v-model:value="field.type" placeholder="请选择数据类型">
                    <a-select-option value="string">字符串</a-select-option>
                    <a-select-option value="integer">整数</a-select-option>
                    <a-select-option value="decimal">小数</a-select-option>
                    <a-select-option value="date">日期</a-select-option>
                    <a-select-option value="datetime">日期时间</a-select-option>
                    <a-select-option value="boolean">布尔值</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>

              <a-col :span="8">
                <a-form-item
                  :name="['fields', index, 'description']"
                  label="字段描述"
                >
                  <a-input v-model:value="field.description" placeholder="请输入字段描述" />
                </a-form-item>
              </a-col>
            </a-row>

            <!-- 异常处理和特殊场景配置 -->
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item
                  :name="['fields', index, 'exceptionHandling']"
                  label="异常处理规则"
                >
                  <a-textarea
                    v-model:value="field.exceptionHandling"
                    placeholder="请输入数据异常的处理规则，如：空值处理、异常值范围、数据清洗规则等"
                    :rows="3"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item
                  :name="['fields', index, 'specialScenarios']"
                  label="特殊场景说明"
                >
                  <a-textarea
                    v-model:value="field.specialScenarios"
                    placeholder="请描述需要特殊处理的业务场景，如：特定时间段、特殊业务规则等"
                    :rows="3"
                  />
                </a-form-item>
              </a-col>
            </a-row>

            <!-- 指标关联 -->
            <a-row>
              <a-col :span="24">
                <a-form-item
                  :name="['fields', index, 'metricMapping']"
                  label="关联指标"
                >
                  <a-select
                    v-model:value="field.metricMapping"
                    placeholder="请选择关联的标准指标"
                    allowClear
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
              </a-col>
            </a-row>
          </a-card>
        </a-space>
      </div>

      <div class="add-field">
        <a-button type="dashed" block @click="addField">
          <PlusOutlined /> 添加字段
        </a-button>
      </div>
    </a-form>
  </div>
</template>

<script lang="ts" setup>
import { ref, defineProps, defineEmits } from 'vue'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import type { FormInstance } from 'ant-design-vue'

const props = defineProps<{
  initialData?: any
}>()

const emit = defineEmits(['save'])

// 表单实例
const modelFormRef = ref<FormInstance>()

// 表单数据
const modelForm = ref({
  name: '',
  businessDomain: [],
  modelType: '',
  description: '',
  fields: []
})

// 表单校验规则
const modelRules = {
  name: [{ required: true, message: '请输入模型名称' }],
  businessDomain: [{ required: true, message: '请选择行业/业务域' }],
  modelType: [{ required: true, message: '请选择模型类型' }],
  'fields.*.name': [{ required: true, message: '请输入字段名' }],
  'fields.*.type': [{ required: true, message: '请选择数据类型' }]
}

// 行业/业务域选项
const businessDomainOptions = [
  {
    value: 'manufacturing',
    label: '制造业',
    children: [
      { value: 'supply_chain', label: '供应链' },
      { value: 'production', label: '生产' },
      { value: 'quality', label: '质量' }
    ]
  },
  {
    value: 'retail',
    label: '零售业',
    children: [
      { value: 'sales', label: '销售' },
      { value: 'inventory', label: '库存' },
      { value: 'customer', label: '客户' }
    ]
  }
]

// 可用的标准指标列表（实际应从API获取）
const availableMetrics = ref([
  { code: 'revenue', name: '销售收入' },
  { code: 'cost', name: '成本' },
  { code: 'profit', name: '利润' },
  { code: 'inventory_turnover', name: '库存周转率' }
])

// 添加字段
const addField = () => {
  modelForm.value.fields.push({
    name: '',
    type: '',
    description: '',
    metricMapping: undefined,
    exceptionHandling: '',
    specialScenarios: ''
  })
}

// 删除字段
const removeField = (index: number) => {
  modelForm.value.fields.splice(index, 1)
}

// 初始化数据
if (props.initialData) {
  modelForm.value = { ...props.initialData }
}
</script>

<style scoped>
.data-model-editor {
  padding: 24px;
}

.field-list {
  margin-bottom: 16px;
}

.add-field {
  margin-top: 16px;
}
</style>