<template>
  <div class="search-component">
    <!-- 基础搜索区 -->
    <div class="basic-search">
      <a-input-group compact class="search-input-group">
        <a-select 
          v-model:value="searchField" 
          class="search-select"
          :options="searchOptions" 
        />
        <a-input-search
          v-model:value="searchValue"
          placeholder="输入关键词搜索"
          enter-button
          allow-clear
          class="search-input"
          @search="handleSearch"
          @change="handleInputChange"
        />
        <a-button 
          type="primary" 
          :icon="advancedMode ? h(UpOutlined) : h(DownOutlined)"
          class="toggle-button"
          @click="toggleAdvanced"
        />
      </a-input-group>
      
      <!-- 搜索建议下拉框 -->
      <div v-if="showSuggestions && suggestions.length > 0" class="search-suggestions">
        <div 
          v-for="(item, index) in suggestions" 
          :key="index" 
          class="suggestion-item"
          @click="applySuggestion(item)"
        >
          <span v-html="highlightMatch(item)"></span>
        </div>
      </div>
      
      <!-- 快捷筛选标签 -->
      <div class="quick-filters">
        <a-tag 
          v-for="(tag, index) in quickFilters" 
          :key="index"
          :color="tag.color || 'blue'"
          class="filter-tag"
          @click="applyQuickFilter(tag)"
        >
          {{ tag.label }}
        </a-tag>
      </div>
    </div>
    
    <!-- 高级搜索区 -->
    <div v-if="advancedMode" class="advanced-search">
      <a-divider style="margin: 12px 0" />
      
      <a-form layout="vertical" :model="filterForm">
        <a-row :gutter="[16, 16]">
          <!-- 多维度筛选面板 - 动态渲染配置的筛选条件 -->
          <template v-for="(filter, index) in filterConfig" :key="index">
            <a-col :span="filter.span || 6">
              <!-- 日期选择器 -->
              <template v-if="filter.type === 'date'">
                <a-form-item :label="filter.label">
                  <a-date-picker 
                    v-model:value="filterForm[filter.field]" 
                    style="width: 100%" 
                    :placeholder="filter.placeholder" 
                  />
                </a-form-item>
              </template>
              
              <!-- 日期范围选择器 -->
              <template v-else-if="filter.type === 'dateRange'">
                <a-form-item :label="filter.label">
                  <a-range-picker 
                    v-model:value="filterForm[filter.field]" 
                    style="width: 100%" 
                    :placeholder="filter.placeholder || ['开始日期', '结束日期']" 
                  />
                </a-form-item>
              </template>
              
              <!-- 下拉选择器 -->
              <template v-else-if="filter.type === 'select'">
                <a-form-item :label="filter.label">
                  <a-select
                    v-model:value="filterForm[filter.field]"
                    :placeholder="filter.placeholder"
                    style="width: 100%"
                    :options="filter.options"
                    :mode="filter.mode"
                    :allow-clear="true"
                  />
                </a-form-item>
              </template>
              
              <!-- 数值范围输入 -->
              <template v-else-if="filter.type === 'numberRange'">
                <a-form-item :label="filter.label">
                  <a-input-group compact>
                    <a-input-number
                      v-model:value="filterForm[`${filter.field}Min`]"
                      style="width: 45%; text-align: center"
                      :placeholder="'最小值'"
                    />
                    <a-input
                      style="width: 10%; text-align: center; pointer-events: none; background-color: #f5f5f5"
                      placeholder="~"
                      disabled
                    />
                    <a-input-number
                      v-model:value="filterForm[`${filter.field}Max`]"
                      style="width: 45%; text-align: center"
                      :placeholder="'最大值'"
                    />
                  </a-input-group>
                </a-form-item>
              </template>
              
              <!-- 普通输入框 -->
              <template v-else>
                <a-form-item :label="filter.label">
                  <a-input
                    v-model:value="filterForm[filter.field]"
                    :placeholder="filter.placeholder"
                    :allow-clear="true"
                  />
                </a-form-item>
              </template>
            </a-col>
          </template>
        </a-row>
        
        <!-- 排序控制 -->
        <a-row :gutter="[16, 16]">
          <a-col :span="8">
            <a-form-item label="排序方式">
              <a-select
                v-model:value="sortBy"
                style="width: 100%"
                :options="sortOptions"
              />
            </a-form-item>
          </a-col>
          <a-col :span="16" style="text-align: right">
            <a-space>
              <a-button @click="resetFilter">
                重置
              </a-button>
              <a-button type="primary" @click="applyFilter">
                应用筛选
              </a-button>
              <a-button type="primary" ghost @click="saveAsQuickFilter">
                保存为快捷筛选
              </a-button>
              <a-button v-if="enableExport" type="primary" ghost @click="exportResults">
                导出结果
              </a-button>
            </a-space>
          </a-col>
        </a-row>
      </a-form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, h, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import { UpOutlined, DownOutlined } from '@ant-design/icons-vue'
import { debounce } from 'lodash-es'
import type { PropType } from 'vue'

// 定义接口和类型
interface SearchField {
  label: string;
  value: string;
}

interface FilterConfig {
  type: 'date' | 'dateRange' | 'select' | 'numberRange' | 'input';
  label: string;
  field: string;
  span?: number;
  placeholder?: string | string[];
  options?: Array<{ label: string; value: string | number }>;
  mode?: 'multiple' | 'tags';
}

interface QuickFilter {
  label: string;
  value: Record<string, any>;
  color?: string;
}

interface SortOption {
  label: string;
  value: string;
}

interface SearchResult {
  field: string;
  value: string;
  advancedFilters: Record<string, any> | null;
}

interface FilterResult {
  [key: string]: any;
  sortBy: string;
}

type SuggestionSource = string[] | ((query: string, field: string) => Promise<string[]>);

// 组件接收的属性
const props = defineProps({
  // 搜索字段配置
  searchFields: {
    type: Array as PropType<SearchField[]>,
    default: () => [{ label: '全部', value: 'all' }]
  },
  // 筛选条件配置
  filters: {
    type: Array as PropType<FilterConfig[]>,
    default: () => []
  },
  // 排序选项
  sortOptions: {
    type: Array as PropType<SortOption[]>,
    default: () => [
      { label: '创建时间从新到旧', value: 'createdAt,desc' },
      { label: '创建时间从旧到新', value: 'createdAt,asc' }
    ]
  },
  // 快捷筛选条件
  quickFilters: {
    type: Array as PropType<QuickFilter[]>,
    default: () => [
      { label: '今日新增', value: { timeRange: 'today' }, color: 'blue' },
      { label: '待处理', value: { status: 'pending' }, color: 'orange' }
    ]
  },
  // 是否启用导出功能
  enableExport: {
    type: Boolean,
    default: false
  },
  // 搜索建议数据来源（函数或静态数组）
  suggestionSource: {
    type: [Function, Array] as PropType<SuggestionSource>,
    default: () => []
  }
})

// 组件向外部发出的事件
const emit = defineEmits(['search', 'filter', 'export', 'save-filter'])

// 搜索相关的响应式数据
const searchField = ref(props.searchFields[0]?.value || 'all')
const searchValue = ref('')
const showSuggestions = ref(false)
const suggestions = ref<string[]>([])
const searchOptions = computed(() => props.searchFields)

// 高级搜索相关的响应式数据
const advancedMode = ref(false)
const filterForm = reactive<Record<string, any>>({})
const sortBy = ref(props.sortOptions[0]?.value || 'createdAt,desc')
const filterConfig = computed(() => props.filters)
const modalMode = ref<'add' | 'edit'>('add')

// 处理搜索输入变化，实现实时搜索提示
const handleInputChange = debounce(async (e: { target: { value: string } }) => {
  const value = e.target.value.trim()
  if (value.length < 1) {
    showSuggestions.value = false
    suggestions.value = []
    return
  }
  
  try {
    if (typeof props.suggestionSource === 'function') {
      // 如果是函数，调用函数获取建议
      const result = await props.suggestionSource(value, searchField.value)
      suggestions.value = result
    } else if (Array.isArray(props.suggestionSource)) {
      // 如果是数组，进行本地过滤
      suggestions.value = (props.suggestionSource as string[])
        .filter(item => item.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5)
    }
    
    showSuggestions.value = suggestions.value.length > 0
  } catch (error) {
    console.error('获取搜索建议出错:', error)
    showSuggestions.value = false
  }
}, 300)

// 高亮匹配的关键词
const highlightMatch = (text: string): string => {
  if (!searchValue.value) return text
  
  const regex = new RegExp(`(${searchValue.value})`, 'gi')
  return text.replace(regex, '<span style="background-color: #FFEB3B;">$1</span>')
}

// 应用搜索建议
const applySuggestion = (text: string): void => {
  searchValue.value = text
  showSuggestions.value = false
  handleSearch()
}

// 处理搜索按钮点击
const handleSearch = (): void => {
  showSuggestions.value = false
  
  emit('search', {
    field: searchField.value,
    value: searchValue.value,
    advancedFilters: advancedMode.value ? { ...filterForm, sortBy: sortBy.value } : null
  })
}

// 切换高级搜索模式
const toggleAdvanced = (): void => {
  advancedMode.value = !advancedMode.value
  
  if (advancedMode.value) {
    // 展开高级搜索时，确保表单数据初始化
    nextTick(() => {
      props.filters.forEach((filter: FilterConfig) => {
        if (filter.type === 'numberRange') {
          if (filterForm[`${filter.field}Min`] === undefined) {
            filterForm[`${filter.field}Min`] = null
          }
          if (filterForm[`${filter.field}Max`] === undefined) {
            filterForm[`${filter.field}Max`] = null
          }
        } else if (filterForm[filter.field] === undefined) {
          filterForm[filter.field] = null
        }
      })
    })
  }
}

// 应用快捷筛选条件
const applyQuickFilter = (tag: QuickFilter): void => {
  // 应用快捷筛选时，自动展开高级模式
  advancedMode.value = true
  
  // 重置表单，然后应用新的筛选条件
  resetFilter()
  
  // 将标签中的值应用到表单
  nextTick(() => {
    const tagValue = tag.value
    if (tagValue) {
      Object.keys(tagValue).forEach(key => {
        filterForm[key] = tagValue[key]
      })
    }
    
    // 立即应用筛选
    applyFilter()
  })
}

// 应用筛选条件
const applyFilter = (): void => {
  emit('filter', {
    ...filterForm,
    sortBy: sortBy.value
  })
}

// 重置筛选条件
const resetFilter = (): void => {
  // 重置所有筛选字段
  props.filters.forEach((filter: FilterConfig) => {
    if (filter.type === 'numberRange') {
      filterForm[`${filter.field}Min`] = null
      filterForm[`${filter.field}Max`] = null
    } else {
      filterForm[filter.field] = null
    }
  })
  
  // 重置排序为默认值
  sortBy.value = props.sortOptions[0]?.value || 'createdAt,desc'
}

// 保存为快捷筛选
const saveAsQuickFilter = async (): Promise<void> => {
  // 实现保存当前筛选条件为快捷筛选的功能
  const currentFilter = {
    ...filterForm,
    sortBy: sortBy.value
  }
  
  // 检查是否有实际的筛选条件
  const hasFilters = Object.values(currentFilter).some(val => val !== null && val !== undefined && val !== '')
  
  if (!hasFilters) {
    message.warning('请至少设置一个筛选条件')
    return
  }
  
  // 创建一个弹窗让用户给筛选器命名
  const filterName = await new Promise<string>((resolve) => {
    const name = window.prompt('请输入筛选条件名称', '我的筛选条件')
    resolve(name || '')
  })
  
  if (filterName) {
    const filterToSave = {
      ...currentFilter,
      name: filterName
    }
    emit('save-filter', filterToSave)
    message.success(`筛选条件"${filterName}"已保存`)
  }
}

// 导出搜索结果
const exportResults = (): void => {
  emit('export', {
    searchField: searchField.value,
    searchValue: searchValue.value,
    advancedFilters: { ...filterForm, sortBy: sortBy.value }
  })
}

// 监听搜索字段变化
watch(searchField, () => {
  // 当搜索字段变化时，清空搜索值和建议
  searchValue.value = ''
  showSuggestions.value = false
})

// 监听外部过滤器配置变化
watch(() => props.filters, () => {
  // 当过滤器配置变化时，重置表单
  resetFilter()
}, { deep: true })

// 组件初始化时隐藏搜索建议
onMounted(() => {
  document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (target && !target.closest('.search-component')) {
      showSuggestions.value = false
    }
  })
})

// 组件销毁时移除事件监听
onUnmounted(() => {
  document.removeEventListener('click', () => {})
})
</script>

<style lang="scss" scoped>
.search-component {
  margin-bottom: 16px;
  width: 100%;
  
  .basic-search {
    position: relative;
    width: 100%;
    
    .search-input-group {
      display: flex;
      width: 100%;
      
      .search-select {
        width: 120px !important;
        flex-shrink: 0;
      }
      
      .search-input {
        flex: 1;
        width: calc(100% - 180px) !important;
      }
      
      .toggle-button {
        width: 60px !important;
        flex-shrink: 0;
      }
    }
  }
  
  .search-suggestions {
    position: absolute;
    width: calc(100% - 180px);
    left: 120px;
    top: 40px;
    background: white;
    border: 1px solid #d9d9d9;
    border-radius: 0 0 2px 2px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 100;
    max-height: 200px;
    overflow-y: auto;
    
    .suggestion-item {
      padding: 8px 12px;
      cursor: pointer;
      
      &:hover {
        background-color: #f5f5f5;
      }
    }
  }
  
  .quick-filters {
    margin-top: 8px;
    
    .filter-tag {
      margin-right: 8px;
      margin-top: 8px;
      cursor: pointer;
    }
  }
  
  .advanced-search {
    margin-top: 8px;
    padding: 16px;
    background: #f9fafb;
    border-radius: 4px;
  }
}
</style> 