<template>
  <div class="knowledge-management">
    <a-page-header
      title="知识管理平台"
      sub-title="管理企业结构化和非结构化知识，支持文档导入、向量化和RAG应用"
    />

    <a-tabs v-model:activeKey="activeKey" class="knowledge-tabs">
      <a-tab-pane key="documents" tab="文档管理">
        <div class="documents">
          <a-card>
            <div class="card-content">
              <div class="header-actions">
                <div class="search-wrapper">
                  <SearchComponent 
                    :search-fields="documentsSearchFields"
                    :filters="documentsFilters"
                    :sort-options="documentsSortOptions"
                    :quick-filters="documentsQuickFilters"
                    :enable-export="true"
                    @search="handleDocumentsSearch"
                    @filter="handleDocumentsFilter"
                    @export="handleDocumentsExport"
                    @save-filter="handleSaveFilter"
                    class="custom-search-component"
                  />
                </div>
                <div class="action-wrapper">
                  <a-upload
                    :multiple="true"
                    :show-upload-list="false"
                    @change="handleFileUpload"
                  >
                    <a-button type="primary" class="add-button">
                      <template #icon><UploadOutlined /></template>
                      上传文档
                    </a-button>
                  </a-upload>
                </div>
              </div>
            </div>

            <a-table
              :columns="documentsColumns"
              :data-source="documentsData"
              :loading="loading"
              rowKey="id"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'status'">
                  <a-tag :color="getStatusColor(record.status)">
                    {{ getStatusText(record.status) }}
                  </a-tag>
                </template>
                <template v-if="column.key === 'action'">
                  <a-space>
                    <a @click="handleDownloadDoc(record)">下载</a>
                    <a-divider type="vertical" />
                    <a @click="handleViewDoc(record)">查看</a>
                    <a-divider type="vertical" />
                    <a-popconfirm
                      title="确定要删除这个文档吗？"
                      @confirm="handleDeleteDoc(record)"
                    >
                      <a>删除</a>
                    </a-popconfirm>
                  </a-space>
                </template>
              </template>
            </a-table>
          </a-card>
        </div>
      </a-tab-pane>

      <a-tab-pane key="faq" tab="FAQ管理">
        <div class="faq">
          <a-card>
            <div class="card-content">
              <div class="header-actions">
                <div class="search-wrapper">
                  <SearchComponent 
                    :search-fields="faqSearchFields"
                    :filters="faqFilters"
                    :sort-options="faqSortOptions"
                    :quick-filters="faqQuickFilters"
                    :enable-export="false"
                    @search="handleFAQSearch"
                    @filter="handleFAQFilter"
                    @save-filter="handleSaveFilter"
                    class="custom-search-component"
                  />
                </div>
                <div class="action-wrapper">
                  <a-button type="primary" class="add-button" @click="handleAddFAQ">
                    <template #icon><PlusOutlined /></template>
                    新增FAQ
                  </a-button>
                </div>
              </div>
            </div>

            <a-table
              :columns="faqColumns"
              :data-source="faqData"
              :loading="loading"
              rowKey="id"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'action'">
                  <a-space>
                    <a @click="handleEditFAQ(record)">编辑</a>
                    <a-divider type="vertical" />
                    <a-popconfirm
                      title="确定要删除这个FAQ吗？"
                      @confirm="handleDeleteFAQ(record)"
                    >
                      <a>删除</a>
                    </a-popconfirm>
                  </a-space>
                </template>
              </template>
            </a-table>
          </a-card>
        </div>
      </a-tab-pane>
    </a-tabs>

    <!-- FAQ表单弹窗 -->
    <a-modal v-model:visible="faqModalVisible" :title="faqModalTitle" @ok="handleFAQModalOk">
      <a-form :model="faqForm" ref="faqFormRef" :rules="faqRules">
        <a-form-item label="问题" name="question">
          <a-input v-model:value="faqForm.question" placeholder="请输入问题" />
        </a-form-item>
        <a-form-item label="答案" name="answer">
          <a-textarea v-model:value="faqForm.answer" placeholder="请输入答案" :rows="4" />
        </a-form-item>
        <a-form-item label="分类" name="category">
          <a-select v-model:value="faqForm.category" placeholder="请选择分类">
            <a-select-option value="使用指南">使用指南</a-select-option>
            <a-select-option value="系统配置">系统配置</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { UploadOutlined, PlusOutlined } from '@ant-design/icons-vue'
import type { FormInstance } from 'ant-design-vue'
import { message } from 'ant-design-vue'
import SearchComponent from '../components/SearchComponent.vue'

// 标签页激活key
const activeKey = ref('documents')

// 加载状态
const loading = ref(false)

// 文档表格列定义
const documentsColumns = [
  {
    title: '文档名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '格式',
    dataIndex: 'format',
    key: 'format',
  },
  {
    title: '大小',
    dataIndex: 'size',
    key: 'size',
  },
  {
    title: '处理状态',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: '上传时间',
    dataIndex: 'uploadTime',
    key: 'uploadTime',
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
  },
]

// FAQ表格列定义
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
    title: '更新时间',
    dataIndex: 'updateTime',
    key: 'updateTime',
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
  },
]

// 模拟数据
const documentsData = ref([
  {
    id: 1,
    name: '产品使用手册.docx',
    format: 'Word',
    size: '2.5MB',
    uploadTime: '2024-01-15',
    status: 'processed',
  },
  {
    id: 2,
    name: '财务报表.pdf',
    format: 'PDF',
    size: '1.8MB',
    uploadTime: '2024-01-16',
    status: 'processing',
  },
  {
    id: 3,
    name: '技术规范说明.pptx',
    format: 'PowerPoint',
    size: '3.2MB',
    uploadTime: '2024-01-17',
    status: 'failed',
  },
])

const faqData = ref([
  {
    id: 1,
    question: '如何上传文档？',
    answer: '点击页面上方的"上传文档"按钮，选择需要上传的文档文件，系统支持Word、PDF、PowerPoint等常见格式。',
    category: '使用指南',
    updateTime: '2024-01-15'
  },
  {
    id: 2,
    question: '支持哪些文档格式？',
    answer: '系统支持多种常见文档格式，包括：Word (.docx)、PDF (.pdf)、PowerPoint (.pptx)、Excel (.xlsx) 等办公文档格式。',
    category: '使用指南',
    updateTime: '2024-01-16'
  },
  {
    id: 3,
    question: '如何管理敏感词？',
    answer: '在知识库配置页面的敏感词管理区域，您可以添加、编辑和删除敏感词。每行输入一个敏感词，保存后即可生效。',
    category: '系统配置',
    updateTime: '2024-01-17'
  }
])

// 文档管理搜索配置
const documentsSearchFields = [
  { label: '全部', value: 'all' },
  { label: '文档名称', value: 'name' },
  { label: '格式', value: 'format' },
  { label: '上传时间', value: 'uploadTime' }
]

const documentsFilters = [
  {
    type: 'select' as const,
    label: '文档格式',
    field: 'format',
    options: [
      { label: 'Word', value: 'Word' },
      { label: 'PDF', value: 'PDF' },
      { label: 'PowerPoint', value: 'PowerPoint' },
      { label: 'Excel', value: 'Excel' },
      { label: '其他', value: 'other' }
    ]
  },
  {
    type: 'select' as const,
    label: '处理状态',
    field: 'status',
    options: [
      { label: '待处理', value: 'pending' },
      { label: '处理中', value: 'processing' },
      { label: '已完成', value: 'processed' },
      { label: '失败', value: 'failed' }
    ]
  },
  {
    type: 'dateRange' as const,
    label: '上传时间',
    field: 'uploadTimeRange',
    span: 12
  },
  {
    type: 'numberRange' as const,
    label: '文件大小(MB)',
    field: 'fileSize',
    span: 12
  }
]

const documentsSortOptions = [
  { label: '上传时间从新到旧', value: 'uploadTime,desc' },
  { label: '上传时间从旧到新', value: 'uploadTime,asc' },
  { label: '文件大小从大到小', value: 'size,desc' },
  { label: '文件大小从小到大', value: 'size,asc' }
]

const documentsQuickFilters = [
  { label: '今日上传', value: { uploadTimeRange: 'today' }, color: 'blue' },
  { label: '处理失败', value: { status: 'failed' }, color: 'red' },
  { label: '待处理', value: { status: 'pending' }, color: 'orange' }
]

// FAQ管理搜索配置
const faqSearchFields = [
  { label: '全部', value: 'all' },
  { label: '问题', value: 'question' },
  { label: '答案', value: 'answer' },
  { label: '分类', value: 'category' }
]

const faqFilters = [
  {
    type: 'select' as const,
    label: '分类',
    field: 'category',
    options: [
      { label: '使用指南', value: '使用指南' },
      { label: '系统配置', value: '系统配置' }
    ]
  },
  {
    type: 'dateRange' as const,
    label: '更新时间',
    field: 'updateTimeRange',
    span: 12
  },
  {
    type: 'input' as const,
    label: '关键词',
    field: 'keyword',
    placeholder: '在问题和答案中搜索',
    span: 12
  }
]

const faqSortOptions = [
  { label: '更新时间从新到旧', value: 'updateTime,desc' },
  { label: '更新时间从旧到新', value: 'updateTime,asc' }
]

const faqQuickFilters = [
  { label: '最近更新', value: { updateTimeRange: 'lastWeek' }, color: 'blue' },
  { label: '使用指南', value: { category: '使用指南' }, color: 'green' },
  { label: '系统配置', value: { category: '系统配置' }, color: 'purple' }
]

// 文档状态处理
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    pending: 'orange',
    processing: 'blue',
    processed: 'green',
    failed: 'red',
  }
  return colorMap[status] || 'default'
}

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    processed: '已完成',
    failed: '处理失败',
  }
  return textMap[status] || status
}

// 文件上传处理
const handleFileUpload = (info: any) => {
  if (info.file.status !== 'uploading') {
    console.log(info.file, info.fileList)
  }
  if (info.file.status === 'done') {
    message.success(`${info.file.name} 上传成功`)
    // 这里可以添加上传成功后的逻辑，如刷新文档列表
  } else if (info.file.status === 'error') {
    message.error(`${info.file.name} 上传失败`)
  }
}

// FAQ表单相关
const faqModalVisible = ref(false)
const faqModalTitle = ref('新增FAQ')
const faqFormRef = ref<FormInstance>()
const faqForm = reactive({
  id: 0,
  question: '',
  answer: '',
  category: '',
})
const faqRules = {
  question: [{ required: true, message: '请输入问题', trigger: 'blur' }],
  answer: [{ required: true, message: '请输入答案', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
}

// 处理FAQ相关操作
const handleAddFAQ = () => {
  faqModalTitle.value = '新增FAQ'
  faqForm.id = 0
  faqForm.question = ''
  faqForm.answer = ''
  faqForm.category = ''
  faqModalVisible.value = true
}

const handleEditFAQ = (record: any) => {
  faqModalTitle.value = '编辑FAQ'
  faqForm.id = record.id
  faqForm.question = record.question
  faqForm.answer = record.answer
  faqForm.category = record.category
  faqModalVisible.value = true
}

const handleFAQModalOk = () => {
  faqFormRef.value?.validate().then(() => {
    // 这里可以添加保存FAQ的逻辑
    if (faqForm.id === 0) {
      // 新增
      message.success('新增FAQ成功')
    } else {
      // 编辑
      message.success('编辑FAQ成功')
    }
    faqModalVisible.value = false
  }).catch(error => {
    console.error('验证失败:', error)
  })
}

const handleDeleteFAQ = (record: any) => {
  // 这里可以添加删除FAQ的逻辑
  message.success(`删除FAQ "${record.question}" 成功`)
}

// 文档操作处理
const handleDownloadDoc = (record: any) => {
  // 这里可以添加下载文档的逻辑
  message.success(`下载文档 "${record.name}" 中...`)
}

const handleViewDoc = (record: any) => {
  // 这里可以添加查看文档的逻辑，如打开预览弹窗
  message.info(`查看文档 "${record.name}"`)
}

const handleDeleteDoc = (record: any) => {
  // 这里可以添加删除文档的逻辑
  message.success(`删除文档 "${record.name}" 成功`)
}

// 搜索处理函数
const handleDocumentsSearch = (searchParams: any) => {
  console.log('文档搜索条件:', searchParams)
  // 这里可以添加根据搜索条件过滤文档数据的逻辑
  message.info(`执行文档搜索: ${JSON.stringify(searchParams)}`)
}

const handleDocumentsFilter = (filterParams: any) => {
  console.log('文档筛选条件:', filterParams)
  // 这里可以添加根据筛选条件过滤文档数据的逻辑
  message.info(`应用文档筛选: ${JSON.stringify(filterParams)}`)
}

const handleDocumentsExport = (params: any) => {
  console.log('导出文档:', params)
  // 这里可以添加导出文档数据的逻辑
  message.success('文档数据导出成功')
}

const handleFAQSearch = (searchParams: any) => {
  console.log('FAQ搜索条件:', searchParams)
  // 这里可以添加根据搜索条件过滤FAQ数据的逻辑
  message.info(`执行FAQ搜索: ${JSON.stringify(searchParams)}`)
}

const handleFAQFilter = (filterParams: any) => {
  console.log('FAQ筛选条件:', filterParams)
  // 这里可以添加根据筛选条件过滤FAQ数据的逻辑
  message.info(`应用FAQ筛选: ${JSON.stringify(filterParams)}`)
}

const handleSaveFilter = (filter: any) => {
  console.log('保存筛选条件:', filter)
  // 这里可以添加保存筛选条件的逻辑
  message.success(`筛选条件 "${filter.name}" 已保存`)
}
</script>

<style lang="scss" scoped>
.knowledge-management {
  padding: 24px;
  
  .knowledge-tabs {
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