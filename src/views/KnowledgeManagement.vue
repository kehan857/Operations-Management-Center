<template>
  <div class="knowledge-management">
    <a-page-header
      title="知识管理平台"
      sub-title="管理企业结构化和非结构化知识，支持文档导入、向量化和RAG应用"
    />

    <a-tabs v-model:activeKey="activeKey" class="knowledge-tabs">
      <!-- 文档管理标签页 -->
      <a-tab-pane key="documents" tab="文档管理">
        <div class="document-management-container">
          <!-- 左侧文档目录树 -->
          <div class="directory-tree-container">
            <DocumentDirectoryTree
              :loading="directoryLoading"
              @select="handleDirectorySelect"
              @add-directory="handleAddDirectory"
              @edit-directory="handleEditDirectory"
              @delete-directory="handleDeleteDirectory"
            />
          </div>
          
          <!-- 右侧文档列表 -->
          <div class="document-list-container">
            <a-card :bordered="false">
              <div class="card-header">
                <div class="header-title">
                  <span class="current-directory">{{ currentDirectory ? currentDirectory.title : '全部文档' }}</span>
                  <span class="document-count" v-if="!isSearching">共 {{ filteredDocumentsData.length }} 个文档</span>
                  <span class="document-count" v-else>找到 {{ filteredDocumentsData.length }} 个相关文档</span>
                </div>
                
                <div class="header-search">
                  <a-input-search
                    placeholder="搜索文档"
                    v-model:value="documentSearchText"
                    @search="handleDocumentSearch"
                    style="width: 250px;"
                    allow-clear
                  />
                </div>
              </div>
              
              <div class="action-buttons">
                <a-button type="primary" @click="handleUploadDocument">
                  <template #icon><UploadOutlined /></template>
                  上传文档
                </a-button>
                <a-button type="primary" @click="handleCreateDocument">
                  <template #icon><FileAddOutlined /></template>
                  新建文档
                </a-button>
              </div>

            <a-table
              :columns="documentsColumns"
                :data-source="filteredDocumentsData"
                :loading="documentsLoading"
                :pagination="{ 
                  pageSize: 10, 
                  showSizeChanger: true, 
                  showTotal: (total: number): string => `共 ${total} 条` 
                }"
              rowKey="id"
            >
              <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'title'">
                    <div class="document-title">
                      <a-space>
                        <component :is="getDocumentIcon(record.format)" />
                        <span>{{ record.title }}</span>
                      </a-space>
                    </div>
                  </template>
                  
                  <template v-if="column.key === 'tags'">
                    <a-space wrap>
                      <a-tag v-for="tag in record.tags" :key="tag" color="blue">{{ tag }}</a-tag>
                    </a-space>
                  </template>
                  
                <template v-if="column.key === 'status'">
                  <a-tag :color="getStatusColor(record.status)">
                    {{ getStatusText(record.status) }}
                  </a-tag>
                </template>
                  
                <template v-if="column.key === 'action'">
                  <a-space>
                      <a @click="handleViewDocument(record)">查看</a>
                      <a-divider type="vertical" />
                      <a @click="handleDownloadDocument(record)">下载</a>
                    <a-divider type="vertical" />
                      <a @click="handleEditDocument(record)">编辑</a>
                    <a-divider type="vertical" />
                    <a-popconfirm
                      title="确定要删除这个文档吗？"
                        @confirm="handleDeleteDocument(record)"
                    >
                      <a>删除</a>
                    </a-popconfirm>
                  </a-space>
                </template>
              </template>
                
                <template #emptyText>
                  <div class="empty-container">
                    <div v-if="isSearching">
                      <SearchOutlined style="font-size: 48px; color: #bfbfbf" />
                      <p>未找到符合条件的文档</p>
                    </div>
                    <div v-else>
                      <InboxOutlined style="font-size: 48px; color: #bfbfbf" />
                      <p>暂无文档，请上传或新建文档</p>
                    </div>
                  </div>
              </template>
            </a-table>
          </a-card>
          </div>
        </div>
      </a-tab-pane>

      <!-- FAQ管理标签页 -->
      <a-tab-pane key="faq" tab="FAQ管理">
        <div class="faq-management-container">
          <!-- 左侧FAQ分类树 -->
          <div class="category-tree-container">
            <FAQCategoryTree
              :loading="categoryLoading"
              @select="handleCategorySelect"
              @add-category="handleAddCategory"
              @edit-category="handleEditCategory"
              @delete-category="handleDeleteCategory"
            />
          </div>
          
          <!-- 右侧FAQ列表 -->
          <div class="faq-list-container">
            <a-card :bordered="false">
              <div class="card-header">
                <div class="header-title">
                  <span class="current-category">{{ currentCategory ? currentCategory.title : '全部FAQ' }}</span>
                  <span class="faq-count" v-if="!isSearchingFAQ">共 {{ filteredFAQData.length }} 个FAQ</span>
                  <span class="faq-count" v-else>找到 {{ filteredFAQData.length }} 个相关FAQ</span>
                </div>
                
                <div class="header-search">
                  <a-input-search
                    placeholder="搜索FAQ"
                    v-model:value="faqSearchText"
                    @search="handleFAQSearch"
                    style="width: 250px;"
                    allow-clear
                  />
                </div>
              </div>
              
              <div class="action-buttons">
              <a-button type="primary" @click="handleAddFAQ">
                <template #icon><PlusOutlined /></template>
                  新建FAQ
                </a-button>
                <a-button @click="handleImportFAQ">
                  <template #icon><ImportOutlined /></template>
                  导入FAQ
              </a-button>
              </div>

            <a-table
              :columns="faqColumns"
                :data-source="filteredFAQData"
                :loading="faqLoading"
                :pagination="{ 
                  pageSize: 10, 
                  showSizeChanger: true, 
                  showTotal: (total: number): string => `共 ${total} 条` 
                }"
              rowKey="id"
                :expandable="{ expandedRowKeys: expandedRowKeys }"
            >
                <template #expandedRowRender="{ record }">
                  <p style="margin: 0">{{ record.answer }}</p>
                </template>
              <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'question'">
                    <div class="faq-question">
                      <QuestionCircleOutlined style="color: #1890ff; margin-right: 8px" />
                      <span>{{ record.question }}</span>
                    </div>
                  </template>
                  
                  <template v-if="column.key === 'tags'">
                    <a-space wrap>
                      <a-tag v-for="tag in record.tags" :key="tag" color="green">{{ tag }}</a-tag>
                    </a-space>
                  </template>
                  
                  <template v-if="column.key === 'status'">
                    <a-tag :color="record.status === 'enabled' ? 'green' : 'red'">
                      {{ record.status === 'enabled' ? '已启用' : '已禁用' }}
                    </a-tag>
                  </template>
                  
                <template v-if="column.key === 'action'">
                  <a-space>
                    <a @click="handleEditFAQ(record)">编辑</a>
                      <a-divider type="vertical" />
                      <a @click="handleToggleFAQStatus(record)">
                        {{ record.status === 'enabled' ? '禁用' : '启用' }}
                      </a>
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
                
                <template #emptyText>
                  <div class="empty-container">
                    <div v-if="isSearchingFAQ">
                      <SearchOutlined style="font-size: 48px; color: #bfbfbf" />
                      <p>未找到符合条件的FAQ</p>
                    </div>
                    <div v-else>
                      <QuestionCircleOutlined style="font-size: 48px; color: #bfbfbf" />
                      <p>暂无FAQ，请添加或导入FAQ</p>
                    </div>
                  </div>
              </template>
            </a-table>
          </a-card>
          </div>
        </div>
      </a-tab-pane>
    </a-tabs>

    <!-- 上传文档弹窗 -->
    <a-modal
      v-model:visible="uploadModalVisible"
      title="上传文档"
      :footer="null"
      @cancel="uploadModalVisible = false"
    >
      <div class="upload-modal-content">
        <a-alert
          type="info"
          show-icon
          message="文档模板"
          description="根据文档模板规范上传文档，以便系统正确处理您的文档。"
          style="margin-bottom: 16px"
        />
        
        <a-button type="link" class="template-download-link">
          <DownloadOutlined /> 下载文档模板
        </a-button>
        
        <a-divider />
        
        <a-form :model="uploadForm" :rules="uploadRules" ref="uploadFormRef" layout="vertical">
          <a-form-item label="目标目录" name="directoryId" required>
            <a-tree-select
              v-model:value="uploadForm.directoryId"
              :tree-data="directoryTreeData"
              placeholder="请选择目标目录"
              tree-default-expand-all
              show-search
              style="width: 100%"
            />
          </a-form-item>
          
          <a-form-item label="关联知识库" name="knowledgeBaseIds" required>
            <a-select
              v-model:value="uploadForm.knowledgeBaseIds"
              mode="multiple"
              placeholder="请选择关联知识库"
              style="width: 100%"
            >
              <a-select-option v-for="kb in knowledgeBases" :key="kb.id" :value="kb.id">
                {{ kb.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
          
          <a-form-item label="文档标签" name="tags">
            <a-select
              v-model:value="uploadForm.tags"
              mode="tags"
              placeholder="请输入标签，按Enter确认"
              style="width: 100%"
            />
          </a-form-item>
          
          <a-form-item label="上传文件" name="files" required>
            <a-upload-dragger
              v-model:fileList="uploadForm.files"
              :multiple="true"
              action="/api/documents/upload"
              :before-upload="handleBeforeUpload"
              @change="handleUploadChange"
            >
              <p class="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p class="ant-upload-hint">
                支持单个或批量上传。支持 PDF、Word、Excel、PowerPoint 等格式。
              </p>
            </a-upload-dragger>
          </a-form-item>
          
          <div class="modal-footer">
            <a-button @click="uploadModalVisible = false">取消</a-button>
            <a-button type="primary" :loading="uploading" @click="handleSubmitUpload">
              上传
            </a-button>
          </div>
        </a-form>
      </div>
    </a-modal>

    <!-- 编辑/新建文档元数据弹窗 -->
    <a-modal
      v-model:visible="documentModalVisible"
      :title="documentModalTitle"
      @ok="handleDocumentModalOk"
      :confirmLoading="documentSubmitting"
      @cancel="documentModalVisible = false"
    >
      <a-form :model="documentForm" :rules="documentRules" ref="documentFormRef" layout="vertical">
        <a-form-item label="文档标题" name="title" required>
          <a-input v-model:value="documentForm.title" placeholder="请输入文档标题" />
        </a-form-item>
        
        <a-form-item label="所属目录" name="directoryId" required>
          <a-tree-select
            v-model:value="documentForm.directoryId"
            :tree-data="directoryTreeData"
            placeholder="请选择所属目录"
            tree-default-expand-all
            show-search
            style="width: 100%"
          />
        </a-form-item>
        
        <a-form-item label="关联知识库" name="knowledgeBaseIds" required>
          <a-select
            v-model:value="documentForm.knowledgeBaseIds"
            mode="multiple"
            placeholder="请选择关联知识库"
            style="width: 100%"
          >
            <a-select-option v-for="kb in knowledgeBases" :key="kb.id" :value="kb.id">
              {{ kb.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="文档标签" name="tags">
          <a-select
            v-model:value="documentForm.tags"
            mode="tags"
            placeholder="请输入标签，按Enter确认"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- FAQ表单弹窗 -->
    <a-modal
      v-model:visible="faqModalVisible"
      :title="faqModalTitle"
      @ok="handleFAQModalOk"
      :confirmLoading="faqSubmitting"
      @cancel="faqModalVisible = false"
      width="800px"
    >
      <a-form :model="faqForm" :rules="faqRules" ref="faqFormRef" layout="vertical">
        <a-form-item label="问题" name="question" required>
          <a-input v-model:value="faqForm.question" placeholder="请输入问题" />
        </a-form-item>
        
        <a-form-item label="答案" name="answer" required>
          <a-textarea v-model:value="faqForm.answer" placeholder="请输入答案" :rows="6" />
        </a-form-item>
        
        <a-form-item label="所属分类" name="categoryId" required>
          <a-tree-select
            v-model:value="faqForm.categoryId"
            :tree-data="categoryTreeData"
            placeholder="请选择所属分类"
            tree-default-expand-all
            show-search
            style="width: 100%"
          />
        </a-form-item>
        
        <a-form-item label="关联知识库" name="knowledgeBaseIds" required>
          <a-select
            v-model:value="faqForm.knowledgeBaseIds"
            mode="multiple"
            placeholder="请选择关联知识库"
            style="width: 100%"
          >
            <a-select-option v-for="kb in knowledgeBases" :key="kb.id" :value="kb.id">
              {{ kb.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="标签" name="tags">
          <a-select
            v-model:value="faqForm.tags"
            mode="tags"
            placeholder="请输入标签，按Enter确认"
            style="width: 100%"
          />
        </a-form-item>
        
        <a-form-item label="状态" name="status">
          <a-radio-group v-model:value="faqForm.status">
            <a-radio value="enabled">启用</a-radio>
            <a-radio value="disabled">禁用</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 导入FAQ弹窗 -->
    <a-modal
      v-model:visible="importFaqModalVisible"
      title="导入FAQ"
      :footer="null"
      @cancel="importFaqModalVisible = false"
    >
      <div class="import-modal-content">
        <a-alert
          type="info"
          show-icon
          message="FAQ导入模板"
          description="请下载模板，按格式填写FAQ内容后上传导入。"
          style="margin-bottom: 16px"
        />
        
        <a-button type="link" class="template-download-link">
          <DownloadOutlined /> 下载Excel导入模板
        </a-button>
        
        <a-divider />
        
        <a-form :model="importForm" :rules="importRules" ref="importFormRef" layout="vertical">
          <a-form-item label="导入至分类" name="categoryId" required>
            <a-tree-select
              v-model:value="importForm.categoryId"
              :tree-data="categoryTreeData"
              placeholder="请选择目标分类"
              tree-default-expand-all
              show-search
              style="width: 100%"
            />
          </a-form-item>
          
          <a-form-item label="关联知识库" name="knowledgeBaseIds" required>
            <a-select
              v-model:value="importForm.knowledgeBaseIds"
              mode="multiple"
              placeholder="请选择关联知识库"
              style="width: 100%"
            >
              <a-select-option v-for="kb in knowledgeBases" :key="kb.id" :value="kb.id">
                {{ kb.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
          
          <a-form-item label="上传文件" name="file" required>
            <a-upload
              v-model:fileList="importForm.files"
              :maxCount="1"
              :beforeUpload="() => false"
            >
              <a-button>
                <UploadOutlined /> 选择文件
              </a-button>
            </a-upload>
          </a-form-item>
          
          <div class="modal-footer">
            <a-button @click="importFaqModalVisible = false">取消</a-button>
            <a-button type="primary" :loading="importing" @click="handleSubmitImport">
              导入
            </a-button>
          </div>
        </a-form>
      </div>
    </a-modal>

    <!-- 文档预览弹窗 -->
    <a-modal
      v-model:visible="previewModalVisible"
      :title="previewingDocument?.title"
      width="800px"
      @cancel="previewModalVisible = false"
      :footer="null"
    >
      <div class="document-preview">
        <div v-if="previewLoading" class="preview-loading">
          <a-spin tip="文档加载中..." />
        </div>
        <div v-else class="preview-content">
          <div v-if="previewError" class="preview-error">
            <ExclamationCircleOutlined style="font-size: 48px; color: #ff4d4f" />
            <p>{{ previewError }}</p>
            <a-button @click="handleDownloadDocument(previewingDocument)">下载文档</a-button>
          </div>
          <div v-else class="preview-iframe-container">
            <iframe :src="previewUrl" width="100%" height="600"></iframe>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { UploadOutlined, PlusOutlined, FileAddOutlined, DownloadOutlined, SearchOutlined, InboxOutlined, ExclamationCircleOutlined, QuestionCircleOutlined, ImportOutlined, FileTextOutlined, FilePdfOutlined, FileExcelOutlined, FilePptOutlined, FileWordOutlined, FileUnknownOutlined } from '@ant-design/icons-vue'
import type { FormInstance } from 'ant-design-vue'
import { message } from 'ant-design-vue'
import DocumentDirectoryTree from '../components/DocumentDirectoryTree.vue'
import FAQCategoryTree from '../components/FAQCategoryTree.vue'

// ===== 通用状态 =====
// 标签页激活key
const activeKey = ref('documents')

// ===== 文档管理部分 =====
// 加载状态
const documentsLoading = ref(false)
const directoryLoading = ref(false)

// 搜索状态
const documentSearchText = ref('')
const isSearching = ref(false)

// 当前选中的目录
const currentDirectory = ref<any>(null)

// 目录树数据
const directoryTreeData = ref<any[]>([])

// 文档数据
const documentsData = ref([
  {
    id: 1,
    title: '产品使用手册',
    format: 'docx',
    size: '2.5MB',
    uploadTime: '2024-01-15',
    status: 'processed',
    tags: ['产品', '用户手册'],
    creator: '张三',
    directory: '产品文档'
  },
  {
    id: 2,
    title: '财务报表',
    format: 'pdf',
    size: '1.8MB',
    uploadTime: '2024-01-16',
    status: 'processing',
    tags: ['财务', '报表'],
    creator: '李四',
    directory: '管理制度'
  },
  {
    id: 3,
    title: '技术规范说明',
    format: 'pptx',
    size: '3.2MB',
    uploadTime: '2024-01-17',
    status: 'failed',
    tags: ['技术', '规范'],
    creator: '王五',
    directory: '工艺文档'
  },
])

// 过滤后的文档数据
const filteredDocumentsData = computed(() => {
  // 根据当前选中目录和搜索条件过滤文档
  let result = documentsData.value
  
  if (currentDirectory.value) {
    result = result.filter(doc => doc.directory === currentDirectory.value.title)
  }
  
  if (documentSearchText.value) {
    const search = documentSearchText.value.toLowerCase()
    result = result.filter(doc => 
      doc.title.toLowerCase().includes(search) || 
      doc.tags.some(tag => tag.toLowerCase().includes(search))
    )
  }
  
  return result
})

// 文档列表列定义
const documentsColumns = [
  {
    title: '文档标题',
    dataIndex: 'title',
    key: 'title',
  },
  {
    title: '标签',
    dataIndex: 'tags',
    key: 'tags',
  },
  {
    title: '所属目录',
    dataIndex: 'directory',
    key: 'directory',
  },
  {
    title: '创建人',
    dataIndex: 'creator',
    key: 'creator',
  },
  {
    title: '创建时间',
    dataIndex: 'uploadTime',
    key: 'uploadTime',
  },
  {
    title: '文档大小',
    dataIndex: 'size',
    key: 'size',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: '操作',
    key: 'action',
    width: 250,
  },
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

// 根据文档格式获取对应图标
const getDocumentIcon = (format: string) => {
  const formatMap: Record<string, any> = {
    'pdf': FilePdfOutlined,
    'docx': FileWordOutlined,
    'doc': FileWordOutlined,
    'xlsx': FileExcelOutlined,
    'xls': FileExcelOutlined,
    'pptx': FilePptOutlined,
    'ppt': FilePptOutlined,
    'txt': FileTextOutlined,
  }
  return formatMap[format] || FileUnknownOutlined
}

// 上传文档相关
const uploadModalVisible = ref(false)
const uploading = ref(false)
const uploadFormRef = ref<FormInstance>()
const uploadForm = reactive({
  directoryId: '',
  knowledgeBaseIds: [] as string[],
  tags: [] as string[],
  files: [] as any[],
})

const uploadRules = {
  directoryId: [{ required: true, message: '请选择目标目录', trigger: 'change' }],
  knowledgeBaseIds: [{ required: true, message: '请选择关联知识库', trigger: 'change' }],
  files: [{ required: true, message: '请上传文档文件', trigger: 'change' }],
}

// 文档编辑相关
const documentModalVisible = ref(false)
const documentSubmitting = ref(false)
const documentModalTitle = ref('编辑文档')
const documentFormRef = ref<FormInstance>()
const documentForm = reactive({
  id: '',
  title: '',
  directoryId: '',
  knowledgeBaseIds: [] as string[],
  tags: [] as string[],
})

const documentRules = {
  title: [{ required: true, message: '请输入文档标题', trigger: 'blur' }],
  directoryId: [{ required: true, message: '请选择所属目录', trigger: 'change' }],
  knowledgeBaseIds: [{ required: true, message: '请选择关联知识库', trigger: 'change' }],
}

// 文档预览相关
const previewModalVisible = ref(false)
const previewingDocument = ref<any>(null)
const previewLoading = ref(false)
const previewError = ref<string | null>(null)
const previewUrl = ref('')

// 知识库列表（模拟数据）
const knowledgeBases = ref([
  { id: '1', name: '产品知识库' },
  { id: '2', name: '技术知识库' },
  { id: '3', name: '管理知识库' },
])

// ===== FAQ管理部分 =====
// 加载状态
const faqLoading = ref(false)
const categoryLoading = ref(false)

// 搜索状态
const faqSearchText = ref('')
const isSearchingFAQ = ref(false)

// 展开行状态
const expandedRowKeys = ref<string[]>([])

// 当前选中的分类
const currentCategory = ref<any>(null)

// 分类树数据
const categoryTreeData = ref<any[]>([])

// FAQ数据
const faqData = ref([
  {
    id: 1,
    question: '如何上传文档？',
    answer: '点击页面上方的"上传文档"按钮，选择需要上传的文档文件，系统支持Word、PDF、PowerPoint等常见格式。',
    category: '使用指南',
    updateTime: '2024-01-15',
    tags: ['文档', '上传'],
    status: 'enabled'
  },
  {
    id: 2,
    question: '支持哪些文档格式？',
    answer: '系统支持多种常见文档格式，包括：Word (.docx)、PDF (.pdf)、PowerPoint (.pptx)、Excel (.xlsx) 等办公文档格式。',
    category: '使用指南',
    updateTime: '2024-01-16',
    tags: ['文档', '格式'],
    status: 'enabled'
  },
  {
    id: 3,
    question: '如何管理敏感词？',
    answer: '在知识库配置页面的敏感词管理区域，您可以添加、编辑和删除敏感词。每行输入一个敏感词，保存后即可生效。',
    category: '系统配置',
    updateTime: '2024-01-17',
    tags: ['敏感词', '配置'],
    status: 'disabled'
  },
])

// 过滤后的FAQ数据
const filteredFAQData = computed(() => {
  // 根据当前选中分类和搜索条件过滤FAQ
  let result = faqData.value
  
  if (currentCategory.value) {
    result = result.filter(faq => faq.category === currentCategory.value.title)
  }
  
  if (faqSearchText.value) {
    const search = faqSearchText.value.toLowerCase()
    result = result.filter(faq => 
      faq.question.toLowerCase().includes(search) || 
      faq.answer.toLowerCase().includes(search) ||
      faq.tags.some(tag => tag.toLowerCase().includes(search))
    )
  }
  
  return result
})

// FAQ列表列定义
const faqColumns = [
  {
    title: '问题',
    dataIndex: 'question',
    key: 'question',
    width: '40%',
  },
  {
    title: '分类',
    dataIndex: 'category',
    key: 'category',
  },
  {
    title: '标签',
    dataIndex: 'tags',
    key: 'tags',
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
    width: 220,
  },
]

// FAQ表单相关
const faqModalVisible = ref(false)
const faqSubmitting = ref(false)
const faqModalTitle = ref('新增FAQ')
const faqFormRef = ref<FormInstance>()
const faqForm = reactive({
  id: '',
  question: '',
  answer: '',
  categoryId: '',
  knowledgeBaseIds: [] as string[],
  tags: [] as string[],
  status: 'enabled',
})

const faqRules = {
  question: [{ required: true, message: '请输入问题', trigger: 'blur' }],
  answer: [{ required: true, message: '请输入答案', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  knowledgeBaseIds: [{ required: true, message: '请选择关联知识库', trigger: 'change' }],
}

// FAQ导入相关
const importFaqModalVisible = ref(false)
const importing = ref(false)
const importFormRef = ref<FormInstance>()
const importForm = reactive({
  categoryId: '',
  knowledgeBaseIds: [] as string[],
  files: [] as any[],
})

const importRules = {
  categoryId: [{ required: true, message: '请选择目标分类', trigger: 'change' }],
  knowledgeBaseIds: [{ required: true, message: '请选择关联知识库', trigger: 'change' }],
  files: [{ required: true, message: '请上传文件', trigger: 'change' }],
}

// ===== 方法定义 =====
// 目录树相关方法
const handleDirectorySelect = (key: string, node: any) => {
  currentDirectory.value = node
  isSearching.value = false
  documentSearchText.value = ''
}

const handleAddDirectory = (directory: any) => {
  // 实际应用中，这里应该调用API保存目录
  message.success(`目录 "${directory.title}" 添加成功`)
}

const handleEditDirectory = (directory: any) => {
  // 实际应用中，这里应该调用API更新目录
  message.success(`目录 "${directory.title}" 更新成功`)
}

const handleDeleteDirectory = (key: string) => {
  // 实际应用中，这里应该调用API删除目录
  message.success('目录删除成功')
}

// 文档相关方法
const handleDocumentSearch = (value: string) => {
  documentSearchText.value = value
  isSearching.value = !!value
}

const handleUploadDocument = () => {
  // 初始化上传表单
  uploadForm.directoryId = currentDirectory.value?.key || ''
  uploadForm.knowledgeBaseIds = []
  uploadForm.tags = []
  uploadForm.files = []
  
  uploadModalVisible.value = true
}

const handleSubmitUpload = () => {
  uploadFormRef.value?.validate().then(() => {
    // 模拟上传
    uploading.value = true
    setTimeout(() => {
      uploading.value = false
      uploadModalVisible.value = false
      message.success('文档上传成功')
      // 实际应用中，这里应该调用API上传文档并刷新文档列表
    }, 1500)
  }).catch(err => {
    console.error('表单验证失败:', err)
  })
}

const handleBeforeUpload = () => {
  return false // 阻止自动上传，由我们手动处理
}

const handleUploadChange = (info: any) => {
  // 处理上传状态变化
  if (info.file.status !== 'uploading') {
    console.log(info.file, info.fileList)
  }
}

const handleCreateDocument = () => {
  documentModalTitle.value = '新建文档'
  documentForm.id = ''
  documentForm.title = ''
  documentForm.directoryId = currentDirectory.value?.key || ''
  documentForm.knowledgeBaseIds = []
  documentForm.tags = []
  
  documentModalVisible.value = true
}

const handleEditDocument = (record: any) => {
  documentModalTitle.value = '编辑文档'
  documentForm.id = record.id
  documentForm.title = record.title
  documentForm.directoryId = record.directoryId || ''
  documentForm.knowledgeBaseIds = record.knowledgeBaseIds || []
  documentForm.tags = record.tags || []
  
  documentModalVisible.value = true
}

const handleDocumentModalOk = () => {
  documentFormRef.value?.validate().then(() => {
    // 模拟保存
    documentSubmitting.value = true
    setTimeout(() => {
      documentSubmitting.value = false
      documentModalVisible.value = false
      message.success('文档保存成功')
      // 实际应用中，这里应该调用API保存文档并刷新文档列表
    }, 1000)
  }).catch(err => {
    console.error('表单验证失败:', err)
  })
}

const handleViewDocument = (record: any) => {
  previewingDocument.value = record
  previewLoading.value = true
  previewError.value = null
  previewModalVisible.value = true
  
  // 模拟加载预览
  setTimeout(() => {
    previewLoading.value = false
    
    // 模拟成功或失败的预览
    if (record.status === 'processed') {
      previewUrl.value = `https://example.com/preview/${record.id}`
    } else {
      previewError.value = '该文档尚未处理完成，无法预览'
    }
  }, 1500)
}

const handleDownloadDocument = (record: any) => {
  // 实际应用中，这里应该调用API下载文档
  message.success(`文档 "${record.title}" 下载中...`)
}

const handleDeleteDocument = (record: any) => {
  // 实际应用中，这里应该调用API删除文档
  message.success(`文档 "${record.title}" 已删除`)
}

// FAQ分类相关方法
const handleCategorySelect = (key: string, node: any) => {
  currentCategory.value = node
  isSearchingFAQ.value = false
  faqSearchText.value = ''
}

const handleAddCategory = (category: any) => {
  // 实际应用中，这里应该调用API保存分类
  message.success(`分类 "${category.title}" 添加成功`)
}

const handleEditCategory = (category: any) => {
  // 实际应用中，这里应该调用API更新分类
  message.success(`分类 "${category.title}" 更新成功`)
}

const handleDeleteCategory = (key: string) => {
  // 实际应用中，这里应该调用API删除分类
  message.success('分类删除成功')
}

// FAQ相关方法
const handleFAQSearch = (value: string) => {
  faqSearchText.value = value
  isSearchingFAQ.value = !!value
}

const handleAddFAQ = () => {
  faqModalTitle.value = '新建FAQ'
  faqForm.id = ''
  faqForm.question = ''
  faqForm.answer = ''
  faqForm.categoryId = currentCategory.value?.key || ''
  faqForm.knowledgeBaseIds = []
  faqForm.tags = []
  faqForm.status = 'enabled'
  
  faqModalVisible.value = true
}

const handleEditFAQ = (record: any) => {
  faqModalTitle.value = '编辑FAQ'
  faqForm.id = record.id
  faqForm.question = record.question
  faqForm.answer = record.answer
  faqForm.categoryId = record.categoryId || ''
  faqForm.knowledgeBaseIds = record.knowledgeBaseIds || []
  faqForm.tags = record.tags || []
  faqForm.status = record.status
  
  faqModalVisible.value = true
}

const handleFAQModalOk = () => {
  faqFormRef.value?.validate().then(() => {
    // 模拟保存
    faqSubmitting.value = true
    setTimeout(() => {
      faqSubmitting.value = false
    faqModalVisible.value = false
      message.success('FAQ保存成功')
      // 实际应用中，这里应该调用API保存FAQ并刷新FAQ列表
    }, 1000)
  }).catch(err => {
    console.error('表单验证失败:', err)
  })
}

const handleDeleteFAQ = (record: any) => {
  // 实际应用中，这里应该调用API删除FAQ
  message.success(`FAQ "${record.question}" 已删除`)
}

const handleToggleFAQStatus = (record: any) => {
  const newStatus = record.status === 'enabled' ? 'disabled' : 'enabled'
  // 实际应用中，这里应该调用API更新FAQ状态
  message.success(`FAQ "${record.question}" 已${newStatus === 'enabled' ? '启用' : '禁用'}`)
}

const handleImportFAQ = () => {
  importForm.categoryId = currentCategory.value?.key || ''
  importForm.knowledgeBaseIds = []
  importForm.files = []
  
  importFaqModalVisible.value = true
}

const handleSubmitImport = () => {
  importFormRef.value?.validate().then(() => {
    // 模拟导入
    importing.value = true
    setTimeout(() => {
      importing.value = false
      importFaqModalVisible.value = false
      message.success('FAQ导入成功')
      // 实际应用中，这里应该调用API导入FAQ并刷新FAQ列表
    }, 1500)
  }).catch(err => {
    console.error('表单验证失败:', err)
  })
}

// 初始化加载
onMounted(() => {
  // 这里可以添加初始化加载数据的逻辑
})
</script>

<style lang="scss" scoped>
.knowledge-management {
  padding: 24px;

  .knowledge-tabs {
    margin-top: 16px;
  }

  // 文档管理样式
  .document-management-container,
  .faq-management-container {
    display: flex;
    height: calc(100vh - 200px);
    min-height: 600px;
    
    .directory-tree-container,
    .category-tree-container {
      width: 250px;
      padding-right: 16px;
      height: 100%;
      overflow-y: auto;
    }
    
    .document-list-container,
    .faq-list-container {
      flex: 1;
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        
        .header-title {
          .current-directory,
          .current-category {
            font-size: 16px;
            font-weight: 500;
            margin-right: 8px;
          }
          
          .document-count,
          .faq-count {
            color: #666;
            font-size: 14px;
          }
        }
      }
      
      .action-buttons {
        margin-bottom: 16px;
        
        .ant-btn {
          margin-right: 12px;
        }
      }
      
      .empty-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 0;
        
        p {
    margin-top: 16px;
          color: #666;
        }
      }
      
      .document-title,
      .faq-question {
        display: flex;
        align-items: center;
      }
    }
  }
  
  // 上传弹窗样式
  .upload-modal-content,
  .import-modal-content {
    .template-download-link {
      padding-left: 0;
    }
    
    .modal-footer {
      margin-top: 24px;
      text-align: right;
      
      .ant-btn {
        margin-left: 8px;
      }
    }
  }
  
  // 文档预览弹窗样式
  .document-preview {
    .preview-loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 400px;
    }
    
    .preview-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 0;
      
      p {
        margin: 16px 0;
        color: #666;
      }
    }
    
    .preview-iframe-container {
      height: 600px;
      
      iframe {
        border: none;
      }
    }
  }
}
</style>