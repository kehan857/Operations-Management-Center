<template>
  <div class="help-center">
    <a-page-header
      title="帮助中心"
      sub-title="管理平台帮助文档与FAQ，为用户提供自助服务支持"
    />

    <a-row :gutter="16" class="help-content">
      <a-col :span="6">
        <a-card title="内容分类">
          <template #extra>
            <a-button type="link" @click="handleAddCategory">
              <template #icon><PlusOutlined /></template>
            </a-button>
          </template>
          <a-tree
            v-model:selectedKeys="selectedKeys"
            v-model:expandedKeys="expandedKeys"
            :tree-data="categoryTree"
            @select="handleCategorySelect"
          >
            <template #title="{ title, key }">
              <a-dropdown :trigger="['contextmenu']">
                <span>{{ title }}</span>
                <template #overlay>
                  <a-menu @click="({ key: menuKey }) => handleCategoryAction(menuKey, key)">
                    <a-menu-item key="edit">编辑</a-menu-item>
                    <a-menu-item key="delete">删除</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </template>
          </a-tree>
        </a-card>
      </a-col>

      <a-col :span="18">
        <a-card>
          <div class="card-content">
            <div class="header-actions">
              <div class="search-wrapper">
                <SearchComponent 
                  :search-fields="searchFields"
                  :filters="filters"
                  :sort-options="sortOptions"
                  :quick-filters="quickFilters"
                  :enable-export="false"
                  @search="handleSearch"
                  @filter="handleFilter"
                  @save-filter="handleSaveFilter"
                  class="custom-search-component"
                />
              </div>
              <div class="action-wrapper">
                <a-space class="right-actions">
                  <a-radio-group v-model:value="contentType" button-style="solid">
                    <a-radio-button value="article">文档</a-radio-button>
                    <a-radio-button value="faq">FAQ</a-radio-button>
                  </a-radio-group>
                  <a-button type="primary" class="add-button" @click="handleAddContent">
                    <template #icon><PlusOutlined /></template>
                    新增{{ contentType === 'article' ? '文档' : 'FAQ' }}
                  </a-button>
                </a-space>
              </div>
            </div>
          </div>

          <a-table
            :columns="contentType === 'article' ? articleColumns : faqColumns"
            :data-source="contentType === 'article' ? articleData : faqData"
            :loading="loading"
            rowKey="id"
            class="content-table"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="record.status === 'published' ? 'green' : 'orange'">
                  {{ record.status === 'published' ? '已发布' : '草稿' }}
                </a-tag>
              </template>
              <template v-if="column.key === 'action'">
                <a-space>
                  <a @click="handleEditContent(record)">编辑</a>
                  <a-divider type="vertical" />
                  <a @click="handlePreviewContent(record)">预览</a>
                  <a-divider type="vertical" />
                  <a-popconfirm
                    :title="`确定要删除这个${contentType === 'article' ? '文档' : 'FAQ'}吗？`"
                    @confirm="handleDeleteContent(record)"
                  >
                    <a>删除</a>
                  </a-popconfirm>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>

    <!-- 分类编辑弹窗 -->
    <a-modal
      v-model:visible="categoryModalVisible"
      :title="categoryModalTitle"
      @ok="handleCategoryModalOk"
    >
      <a-form
        :model="categoryForm"
        :rules="categoryRules"
        ref="categoryFormRef"
        layout="vertical"
      >
        <a-form-item label="分类名称" name="name">
          <a-input v-model:value="categoryForm.name" placeholder="请输入分类名称" />
        </a-form-item>
        <a-form-item label="上级分类" name="parentId">
          <a-tree-select
            v-model:value="categoryForm.parentId"
            :tree-data="categoryTree"
            placeholder="请选择上级分类"
            allow-clear
            tree-default-expand-all
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 内容编辑弹窗 -->
    <a-modal
      v-model:visible="contentModalVisible"
      :title="contentModalTitle"
      width="800px"
      @ok="handleContentModalOk"
    >
      <a-form
        :model="contentForm"
        :rules="contentRules"
        ref="contentFormRef"
        layout="vertical"
      >
        <a-form-item label="标题" name="title">
          <a-input v-model:value="contentForm.title" placeholder="请输入标题" />
        </a-form-item>
        <a-form-item label="所属分类" name="categoryId">
          <a-tree-select
            v-model:value="contentForm.categoryId"
            :tree-data="categoryTree"
            placeholder="请选择分类"
            tree-default-expand-all
          />
        </a-form-item>
        <template v-if="contentType === 'article'">
          <a-form-item label="内容" name="content">
            <!-- 这里可以集成富文本编辑器 -->
            <a-textarea
              v-model:value="contentForm.content"
              placeholder="请输入内容"
              :rows="10"
            />
          </a-form-item>
        </template>
        <template v-else>
          <a-form-item label="问题" name="question">
            <a-input v-model:value="contentForm.question" placeholder="请输入问题" />
          </a-form-item>
          <a-form-item label="答案" name="answer">
            <a-textarea
              v-model:value="contentForm.answer"
              placeholder="请输入答案"
              :rows="4"
            />
          </a-form-item>
        </template>
      </a-form>
    </a-modal>

    <!-- 预览抽屉 -->
    <a-drawer
      v-model:visible="previewDrawerVisible"
      title="内容预览"
      width="600"
      placement="right"
    >
      <template v-if="contentType === 'article'">
        <h2>{{ previewData.title }}</h2>
        <div class="article-content">
          {{ previewData.content }}
        </div>
      </template>
      <template v-else>
        <h3>问题：</h3>
        <p>{{ previewData.question }}</p>
        <h3>答案：</h3>
        <p>{{ previewData.answer }}</p>
      </template>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import type { FormInstance } from 'ant-design-vue'
import { message } from 'ant-design-vue'
import SearchComponent from '../components/SearchComponent.vue'

// 内容类型
const contentType = ref('article')
const loading = ref(false)

// 搜索配置
const searchFields = computed(() => [
  { label: '全部', value: 'all' },
  { label: contentType.value === 'article' ? '标题' : '问题', value: 'title' },
  { label: '内容', value: 'content' },
  { label: '分类', value: 'category' }
])

const filters = [
  {
    type: 'select' as const,
    label: '状态',
    field: 'status',
    options: [
      { label: '已发布', value: 'published' },
      { label: '草稿', value: 'draft' }
    ]
  },
  {
    type: 'dateRange' as const,
    label: '更新时间',
    field: 'updateTime'
  }
]

const sortOptions = [
  { label: '更新时间：从新到旧', value: 'updateTime,desc' },
  { label: '更新时间：从旧到新', value: 'updateTime,asc' },
  { label: '标题：A-Z', value: 'title,asc' },
  { label: '标题：Z-A', value: 'title,desc' }
]

const quickFilters = [
  { label: '已发布', value: { status: 'published' }, color: 'green' },
  { label: '草稿', value: { status: 'draft' }, color: 'orange' }
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

const handleSaveFilter = (filter: any) => {
  console.log('保存筛选条件:', filter)
  // 保存筛选条件
}

// 分类树相关
const selectedKeys = ref<string[]>([])
const expandedKeys = ref<string[]>([])
const categoryTree = ref([])

// 表格列定义
const articleColumns = [
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title',
  },
  {
    title: '分类',
    dataIndex: 'category',
    key: 'category',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: '更新时间',
    dataIndex: 'updateTime',
    key: 'updateTime',
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
  },
]

const faqColumns = [
  {
    title: '问题',
    dataIndex: 'question',
    key: 'question',
  },
  {
    title: '分类',
    dataIndex: 'category',
    key: 'category',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: '更新时间',
    dataIndex: 'updateTime',
    key: 'updateTime',
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
  },
]

// 模拟数据
const articleData = ref([])
const faqData = ref([])

// 分类表单相关
const categoryModalVisible = ref(false)
const categoryModalTitle = ref('新增分类')
const categoryFormRef = ref<FormInstance>()
const categoryForm = reactive({
  name: '',
  parentId: undefined,
})
const categoryRules = {
  name: [{ required: true, message: '请输入分类名称' }],
}

// 内容表单相关
const contentModalVisible = ref(false)
const contentModalTitle = ref('新增文档')
const contentFormRef = ref<FormInstance>()
const contentForm = reactive({
  title: '',
  categoryId: undefined,
  content: '',
  question: '',
  answer: '',
})
const contentRules = {
  title: [{ required: true, message: '请输入标题' }],
  categoryId: [{ required: true, message: '请选择分类' }],
  content: [{ required: true, message: '请输入内容' }],
  question: [{ required: true, message: '请输入问题' }],
  answer: [{ required: true, message: '请输入答案' }],
}

// 预览相关
const previewDrawerVisible = ref(false)
const previewData = ref({})

// 分类相关操作
const handleAddCategory = () => {
  categoryModalTitle.value = '新增分类'
  categoryModalVisible.value = true
}

const handleCategorySelect = (selectedKeys: string[]) => {
  // 处理分类选择
}

const handleCategoryAction = (action: string, key: string) => {
  if (action === 'edit') {
    categoryModalTitle.value = '编辑分类'
    // 获取分类数据
    categoryModalVisible.value = true
  } else if (action === 'delete') {
    // 处理分类删除
  }
}

const handleCategoryModalOk = () => {
  categoryFormRef.value?.validate().then(() => {
    // 处理分类保存
    categoryModalVisible.value = false
  })
}

// 内容相关操作
const handleAddContent = () => {
  contentModalTitle.value = `新增${contentType.value === 'article' ? '文档' : 'FAQ'}`
  contentModalVisible.value = true
}

const handleEditContent = (record: any) => {
  contentModalTitle.value = `编辑${contentType.value === 'article' ? '文档' : 'FAQ'}`
  Object.assign(contentForm, record)
  contentModalVisible.value = true
}

const handlePreviewContent = (record: any) => {
  previewData.value = record
  previewDrawerVisible.value = true
}

const handleDeleteContent = (record: any) => {
  // 处理内容删除
}

const handleContentModalOk = () => {
  contentFormRef.value?.validate().then(() => {
    // 处理内容保存
    contentModalVisible.value = false
  })
}
</script>

<style lang="scss" scoped>
.help-center {
  padding: 24px;
  
  .help-content {
    margin-top: 16px;
  }
  
  :deep(.ant-card) {
    height: 100%;
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
  
  .article-content {
    white-space: pre-wrap;
    line-height: 1.6;
  }
}
</style>