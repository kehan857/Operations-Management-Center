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
                  <a-menu @click="({ key: menuKey }) => handleCategoryAction(menuKey as string, key)">
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
                    <a-radio-button value="updates">更新日志</a-radio-button>
                  </a-radio-group>
                  <a-button type="primary" class="add-button" @click="handleAddContent">
                    <template #icon><PlusOutlined /></template>
                    新增{{ getContentTypeName }}
                  </a-button>
                </a-space>
              </div>
            </div>
          </div>

          <template v-if="contentType === 'updates'">
            <div class="updates-section">
              <a-form layout="vertical" class="update-form">
                <a-form-item label="添加更新日志">
                  <a-input-group compact>
                    <a-date-picker 
                      v-model:value="updateForm.date" 
                      format="YYYY-MM-DD" 
                      style="width: 120px;"
                      placeholder="日期"
                    />
                    <a-input 
                      v-model:value="updateForm.content" 
                      placeholder="更新内容"  
                      style="width: calc(100% - 200px);"
                    />
                    <a-button type="primary" @click="handleAddUpdate">添加</a-button>
                  </a-input-group>
                </a-form-item>
              </a-form>
              
              <a-list
                class="update-list"
                :data-source="updatesData"
                :loading="loading"
              >
                <template #header>
                  <div class="update-list-header">最新更新</div>
                </template>
                <template #renderItem="{ item }">
                  <a-list-item>
                    <a-list-item-meta>
                      <template #title>
                        <div class="update-item">
                          <span class="update-date">[{{ item.date }}]</span>
                          <span class="update-content">{{ item.content }}</span>
                        </div>
                      </template>
                    </a-list-item-meta>
                    <template #actions>
                      <a key="edit" @click="handleEditUpdate(item)">编辑</a>
                      <a-popconfirm
                        title="确定要删除这条更新记录吗？"
                        @confirm="handleDeleteUpdate(item)"
                      >
                        <a key="delete">删除</a>
                      </a-popconfirm>
                    </template>
                  </a-list-item>
                </template>
              </a-list>
            </div>
          </template>
          
          <a-table
            v-else
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
                  <a @click="handleToggleStatus(record)">
                    {{ record.status === 'published' ? '设为草稿' : '发布' }}
                  </a>
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
        <a-form-item label="分类类型" name="type">
          <a-select v-model:value="categoryForm.type" placeholder="请选择分类类型">
            <a-select-option value="platform">平台使用指引</a-select-option>
            <a-select-option value="faq">常见问题</a-select-option>
            <a-select-option value="other">其他内容</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="是否在首页显示" name="showOnHomepage">
          <a-switch v-model:checked="categoryForm.showOnHomepage" />
        </a-form-item>
        <a-form-item label="显示顺序" name="displayOrder" v-if="categoryForm.showOnHomepage">
          <a-input-number v-model:value="categoryForm.displayOrder" :min="1" :max="100" style="width: 100%" />
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
        <a-form-item label="内容状态" name="status">
          <a-radio-group v-model:value="contentForm.status">
            <a-radio value="published">发布</a-radio>
            <a-radio value="draft">保存为草稿</a-radio>
          </a-radio-group>
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
          <a-form-item label="是否在快速链接中显示" name="isQuickLink">
            <a-switch v-model:checked="contentForm.isQuickLink" />
          </a-form-item>
          <a-form-item label="显示顺序" name="linkOrder" v-if="contentForm.isQuickLink">
            <a-input-number v-model:value="contentForm.linkOrder" :min="1" :max="100" style="width: 100%" />
          </a-form-item>
        </template>
        <template v-else-if="contentType === 'faq'">
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
          <a-form-item label="是否为常见问题" name="isFrequent">
            <a-switch v-model:checked="contentForm.isFrequent" />
          </a-form-item>
          <a-form-item label="显示顺序" name="frequentOrder" v-if="contentForm.isFrequent">
            <a-input-number v-model:value="contentForm.frequentOrder" :min="1" :max="100" style="width: 100%" />
          </a-form-item>
        </template>
      </a-form>
    </a-modal>

    <!-- 更新日志编辑弹窗 -->
    <a-modal
      v-model:visible="updateModalVisible"
      title="编辑更新日志"
      @ok="handleUpdateModalOk"
    >
      <a-form
        :model="editingUpdate"
        ref="updateFormRef"
        layout="vertical"
      >
        <a-form-item label="日期" name="date">
          <a-date-picker
            v-model:value="editingUpdate.dateObj"
            format="YYYY-MM-DD"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="更新内容" name="content">
          <a-input
            v-model:value="editingUpdate.content"
            placeholder="请输入更新内容"
          />
        </a-form-item>
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
      <template v-else-if="contentType === 'faq'">
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
import dayjs from 'dayjs'
import SearchComponent from '../components/SearchComponent.vue'

// 内容类型
const contentType = ref('article')
const loading = ref(false)

// 计算当前内容类型名称
const getContentTypeName = computed(() => {
  switch (contentType.value) {
    case 'article':
      return '文档'
    case 'faq':
      return 'FAQ'
    case 'updates':
      return '更新日志'
    default:
      return '内容'
  }
})

// 搜索配置
const searchFields = computed(() => {
  if (contentType.value === 'article') {
    return [
      { label: '全部', value: 'all' },
      { label: '标题', value: 'title' },
      { label: '内容', value: 'content' },
      { label: '分类', value: 'category' }
    ]
  } else if (contentType.value === 'faq') {
    return [
      { label: '全部', value: 'all' },
      { label: '问题', value: 'question' },
      { label: '答案', value: 'answer' },
      { label: '分类', value: 'category' }
    ]
  } else {
    return [
      { label: '全部', value: 'all' },
      { label: '内容', value: 'content' },
      { label: '日期', value: 'date' }
    ]
  }
})

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
const categoryTree = ref<any[]>([
  {
    title: '平台使用指引',
    key: 'platform-guide',
    children: [
      { title: '数据管理', key: 'data-management' },
      { title: '知识管理', key: 'knowledge-management' },
      { title: 'Agent市场', key: 'agent-market' }
    ]
  },
  {
    title: '常见问题',
    key: 'common-questions',
    children: [
      { title: '账号相关', key: 'account-issues' },
      { title: '使用技巧', key: 'usage-tips' }
    ]
  }
])

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
const articleData = ref([
  {
    id: 1,
    title: '如何连接ERP系统',
    category: '数据管理',
    status: 'published',
    updateTime: '2024-04-10 15:30:00',
    content: '在连接ERP系统前，请确保您已获取相关API权限和接口文档...',
    isQuickLink: true,
    linkOrder: 1
  },
  {
    id: 2,
    title: '配置告警规则指南',
    category: 'Agent市场',
    status: 'published',
    updateTime: '2024-04-08 10:15:00',
    content: '告警规则可帮助您监控系统异常情况...',
    isQuickLink: true,
    linkOrder: 2
  }
])

const faqData = ref([
  {
    id: 1,
    question: '数据源管理常见问题',
    category: '数据管理',
    status: 'published',
    updateTime: '2024-04-12 09:20:00',
    answer: '数据源管理中最常见的问题包括连接超时、权限不足等...',
    isFrequent: true,
    frequentOrder: 1
  },
  {
    id: 2,
    question: '智能助手使用技巧',
    category: '使用技巧',
    status: 'published',
    updateTime: '2024-04-09 14:45:00',
    answer: '要充分利用智能助手功能，请尝试以下技巧...',
    isFrequent: true,
    frequentOrder: 2
  }
])

// 分类表单相关
const categoryModalVisible = ref(false)
const categoryModalTitle = ref('新增分类')
const categoryFormRef = ref<FormInstance>()
const categoryForm = reactive({
  name: '',
  parentId: undefined,
  type: 'platform',
  showOnHomepage: false,
  displayOrder: 1
})
const categoryRules = {
  name: [{ required: true, message: '请输入分类名称' }],
  type: [{ required: true, message: '请选择分类类型' }]
}

// 内容表单相关
const contentModalVisible = ref(false)
const contentModalTitle = ref('新增文档')
const contentFormRef = ref<FormInstance>()
const contentForm = reactive({
  title: '',
  categoryId: '' as string | null,
  content: '',
  question: '',
  answer: '',
  status: 'draft' as 'draft' | 'published',
  isQuickLink: false,
  linkOrder: 1,
  isFrequent: false,
  frequentOrder: 1
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
const previewData = ref<any>({})

// 更新日志相关
const updatesData = ref([
  { id: 1, date: '2024-04-15', content: '智能预测功能已上线' },
  { id: 2, date: '2024-04-10', content: '数据源管理功能优化' },
  { id: 3, date: '2024-04-05', content: 'Agent市场新增多项能力' },
  { id: 4, date: '2024-04-01', content: '系统进行更新' }
])

const updateForm = reactive({
  date: null as any,
  content: ''
})

const updateModalVisible = ref(false)
const updateFormRef = ref<FormInstance>()
const editingUpdate = reactive({
  id: 0,
  date: '',
  dateObj: null as any,
  content: ''
})

// 分类相关操作
const handleAddCategory = () => {
  categoryModalTitle.value = '新增分类'
  categoryForm.name = ''
  categoryForm.parentId = undefined
  categoryForm.type = 'platform'
  categoryForm.showOnHomepage = false
  categoryForm.displayOrder = 1
  categoryModalVisible.value = true
}

const handleCategorySelect = (selectedKeys: string[]) => {
  // 处理分类选择
  console.log('已选择分类:', selectedKeys)
}

const handleCategoryAction = (action: string, key: string) => {
  if (action === 'edit') {
    categoryModalTitle.value = '编辑分类'
    // 获取分类数据
    const findCategory = (nodes: any[], key: string): any => {
      for (const node of nodes) {
        if (node.key === key) return node
        if (node.children) {
          const found = findCategory(node.children, key)
          if (found) return found
        }
      }
      return null
    }
    
    const category = findCategory(categoryTree.value, key)
    if (category) {
      categoryForm.name = category.title
      categoryForm.parentId = key.includes('-') ? key.split('-')[0] : undefined
      categoryForm.type = key.includes('platform') ? 'platform' : (key.includes('common') ? 'faq' : 'other')
      categoryForm.showOnHomepage = true
      categoryForm.displayOrder = 1
    }
    
    categoryModalVisible.value = true
  } else if (action === 'delete') {
    // 处理分类删除
    message.success('分类删除成功')
  }
}

const handleCategoryModalOk = () => {
  categoryFormRef.value?.validate().then(() => {
    // 处理分类保存
    message.success(`${categoryModalTitle.value === '新增分类' ? '新增' : '编辑'}分类成功`)
    categoryModalVisible.value = false
  }).catch(err => {
    console.error('表单验证失败:', err)
  })
}

// 内容相关操作
const handleAddContent = () => {
  contentModalTitle.value = contentType.value === 'article' ? '新增文档' : '新增FAQ'
  
  // 重置表单
  contentForm.title = ''
  contentForm.categoryId = undefined
  contentForm.content = ''
  contentForm.question = ''
  contentForm.answer = ''
  contentForm.status = 'draft' // 新增内容默认为草稿状态
  contentForm.isQuickLink = false
  contentForm.linkOrder = 1
  contentForm.isFrequent = false
  contentForm.frequentOrder = 1
  
  contentModalVisible.value = true
}

const handleEditContent = (record: any) => {
  contentModalTitle.value = contentType.value === 'article' ? '编辑文档' : '编辑FAQ'
  
  if (contentType.value === 'article') {
    contentForm.title = record.title
    contentForm.categoryId = 'data-management' // 这里应该使用实际分类ID
    contentForm.content = record.content
    contentForm.status = record.status as 'draft' | 'published'
    contentForm.isQuickLink = record.isQuickLink
    contentForm.linkOrder = record.linkOrder
  } else {
    contentForm.title = record.question
    contentForm.categoryId = 'account-issues' // 这里应该使用实际分类ID
    contentForm.question = record.question
    contentForm.answer = record.answer
    contentForm.status = record.status as 'draft' | 'published'
    contentForm.isFrequent = record.isFrequent
    contentForm.frequentOrder = record.frequentOrder
  }
  
  contentModalVisible.value = true
}

const handlePreviewContent = (record: any) => {
  previewData.value = record
  previewDrawerVisible.value = true
}

const handleDeleteContent = (record: any) => {
  // 处理内容删除
  const dataRef = contentType.value === 'article' ? articleData : faqData
  const index = dataRef.value.findIndex(item => item.id === record.id)
  if (index !== -1) {
    dataRef.value.splice(index, 1)
    message.success(`${contentType.value === 'article' ? '文档' : 'FAQ'}删除成功`)
  }
}

const handleContentModalOk = () => {
  contentFormRef.value?.validate().then(() => {
    // 处理内容保存
    message.success(`${contentModalTitle.value.includes('新增') ? '新增' : '编辑'}${contentType.value === 'article' ? '文档' : 'FAQ'}成功`)
    contentModalVisible.value = false
  }).catch(err => {
    console.error('表单验证失败:', err)
  })
}

// 添加更新日志
const handleAddUpdate = () => {
  if (!updateForm.date || !updateForm.content) {
    message.error('请填写完整的更新日志信息')
    return
  }
  
  const newUpdate = {
    id: Date.now(),
    date: updateForm.date.format('YYYY-MM-DD'),
    content: updateForm.content
  }
  
  updatesData.value.unshift(newUpdate)
  
  // 清空表单
  updateForm.date = null
  updateForm.content = ''
  
  message.success('更新日志添加成功')
}

// 编辑更新日志
const handleEditUpdate = (item: any) => {
  editingUpdate.id = item.id
  editingUpdate.date = item.date
  editingUpdate.dateObj = dayjs(item.date)
  editingUpdate.content = item.content
  
  updateModalVisible.value = true
}

// 提交更新日志编辑
const handleUpdateModalOk = () => {
  if (!editingUpdate.dateObj || !editingUpdate.content) {
    message.error('请填写完整的更新日志信息')
    return
  }
  
  // 更新数据
  const index = updatesData.value.findIndex(item => item.id === editingUpdate.id)
  if (index !== -1) {
    updatesData.value[index] = {
      id: editingUpdate.id,
      date: editingUpdate.dateObj.format('YYYY-MM-DD'),
      content: editingUpdate.content
    }
    
    updateModalVisible.value = false
    message.success('更新日志修改成功')
  }
}

// 删除更新日志
const handleDeleteUpdate = (item: any) => {
  const index = updatesData.value.findIndex(update => update.id === item.id)
  if (index !== -1) {
    updatesData.value.splice(index, 1)
    message.success('更新日志删除成功')
  }
}

// 状态切换处理函数
const handleToggleStatus = (record: any) => {
  const newStatus = record.status === 'published' ? 'draft' : 'published';
  const statusText = newStatus === 'published' ? '发布' : '设为草稿';
  
  // 调用API更新状态
  const targetData = contentType.value === 'article' ? articleData.value : faqData.value;
  const index = targetData.findIndex(item => item.id === record.id);
  
  if (index !== -1) {
    targetData[index].status = newStatus;
    message.success(`已成功${statusText}`);
  }
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

  .updates-section {
    .update-form {
      margin-bottom: 20px;
    }
    
    .update-list {
      background: white;
      
      .update-list-header {
        font-weight: bold;
        font-size: 16px;
      }
      
      .update-item {
        display: flex;
        align-items: center;
        
        .update-date {
          font-weight: bold;
          margin-right: 8px;
          color: #1890ff;
        }
      }
    }
  }
}
</style>