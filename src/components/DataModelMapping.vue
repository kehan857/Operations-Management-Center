<template>
  <div class="data-model-mapping">
    <a-table
      :columns="columns"
      :data-source="mappingData"
      :pagination="false"
      size="middle"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'metricMapping'">
          <a-select
            v-model:value="record.metricMapping"
            style="width: 100%"
            placeholder="请选择关联的标准指标"
            allowClear
            @change="(value) => handleMetricChange(record, value)"
          >
            <a-select-option
              v-for="metric in availableMetrics"
              :key="metric.code"
              :value="metric.code"
            >
              {{ metric.name }}
            </a-select-option>
          </a-select>
        </template>
      </template>
    </a-table>

    <!-- 映射预览 -->
    <a-divider>映射预览</a-divider>
    <a-descriptions bordered>
      <a-descriptions-item
        v-for="mapping in effectiveMappings"
        :key="mapping.field"
        :label="mapping.field"
      >
        {{ mapping.metricName }}
      </a-descriptions-item>
    </a-descriptions>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, defineProps, defineEmits } from 'vue'

const props = defineProps<{
  modelFields: any[]
}>()

const emit = defineEmits(['update:mapping'])

// 表格列定义
const columns = [
  {
    title: '字段名',
    dataIndex: 'fieldName',
    key: 'fieldName',
    width: '20%'
  },
  {
    title: '数据类型',
    dataIndex: 'fieldType',
    key: 'fieldType',
    width: '15%'
  },
  {
    title: '字段描述',
    dataIndex: 'fieldDescription',
    key: 'fieldDescription',
    width: '25%'
  },
  {
    title: '关联指标',
    dataIndex: 'metricMapping',
    key: 'metricMapping',
    width: '40%'
  }
]

// 可用的标准指标列表（实际应从API获取）
const availableMetrics = ref([
  { code: 'revenue', name: '销售收入' },
  { code: 'cost', name: '成本' },
  { code: 'profit', name: '利润' },
  { code: 'inventory_turnover', name: '库存周转率' }
])

// 映射数据
const mappingData = computed(() => {
  return props.modelFields.map(field => ({
    fieldName: field.name,
    fieldType: field.type,
    fieldDescription: field.description,
    metricMapping: field.metricMapping
  }))
})

// 有效的映射关系
const effectiveMappings = computed(() => {
  return mappingData.value
    .filter(item => item.metricMapping)
    .map(item => ({
      field: item.fieldName,
      metricCode: item.metricMapping,
      metricName: availableMetrics.value.find(m => m.code === item.metricMapping)?.name
    }))
})

// 处理指标映射变更
const handleMetricChange = (record: any, value: string) => {
  const updatedMappings = mappingData.value.map(item => {
    if (item.fieldName === record.fieldName) {
      return { ...item, metricMapping: value }
    }
    return item
  })
  emit('update:mapping', updatedMappings)
}
</script>

<style scoped>
.data-model-mapping {
  padding: 24px;
}
</style>