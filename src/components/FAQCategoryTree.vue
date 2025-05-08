<template>
  <div class="faq-category-tree">
    <div class="tree-header">
      <h3>FAQ分类</h3>
      <a-button type="link" @click="handleAddRootCategory">
        <PlusOutlined /> 新建分类
      </a-button>
    </div>
    <a-spin :spinning="loading">
      <a-tree
        :tree-data="treeData"
        :defaultExpandAll="true"
        :selectedKeys="selectedKeys"
        :expandedKeys="expandedKeys"
        @select="handleSelect"
        @expand="handleExpand"
        blockNode
      >
        <template #title="{ title, key }">
          <div class="tree-node">
            <span class="node-title">{{ title }}</span>
            <div class="node-actions">
              <a-dropdown :trigger="['click']">
                <MoreOutlined class="action-icon" />
                <template #overlay>
                  <a-menu>
                    <a-menu-item key="1" @click="handleAddSubCategory(key)">
                      <PlusOutlined /> 新建子分类
                    </a-menu-item>
                    <a-menu-item key="2" @click="handleEditCategory(key)">
                      <EditOutlined /> 编辑
                    </a-menu-item>
                    <a-menu-item key="3" @click="handleDeleteCategory(key)">
                      <DeleteOutlined /> 删除
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </div>
        </template>
      </a-tree>
    </a-spin>

    <!-- 添加/编辑分类弹窗 -->
    <a-modal
      v-model:visible="categoryModalVisible"
      :title="categoryModalTitle"
      @ok="handleCategoryModalOk"
      @cancel="categoryModalVisible = false"
    >
      <a-form
        :model="categoryForm"
        :rules="categoryRules"
        ref="categoryFormRef"
      >
        <a-form-item label="分类名称" name="name">
          <a-input v-model:value="categoryForm.name" placeholder="请输入分类名称" />
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-textarea 
            v-model:value="categoryForm.description" 
            placeholder="请输入分类描述（选填）" 
            :rows="3" 
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 删除确认弹窗 -->
    <a-modal
      v-model:visible="deleteModalVisible"
      title="删除分类"
      okText="删除"
      okType="danger"
      @ok="confirmDeleteCategory"
      @cancel="deleteModalVisible = false"
    >
      <p>确定要删除分类 "{{ categoryToDelete?.title }}" 吗？</p>
      <p v-if="hasChildrenOrFAQs" class="warning-text">
        该分类下包含子分类或FAQ，删除后将无法恢复！
      </p>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, watchEffect, defineEmits, toRaw } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined, EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons-vue';
import type { FormInstance } from 'ant-design-vue';
import type { TreeDataItem } from 'ant-design-vue/es/tree/Tree';

interface CategoryItem extends TreeDataItem {
  key: string;
  title: string;
  parentKey?: string;
  children?: CategoryItem[];
  description?: string;
}

// 定义组件属性
const props = defineProps<{
  initialData?: CategoryItem[];
  loading?: boolean;
}>();

// 定义事件
const emit = defineEmits([
  'select',
  'update:treeData',
  'add-category',
  'edit-category',
  'delete-category'
]);

// 树形数据
const treeData = ref<CategoryItem[]>([
  {
    key: '1',
    title: '产品FAQ',
    children: [
      { key: '1-1', title: '功能问题', parentKey: '1' },
      { key: '1-2', title: '使用问题', parentKey: '1' }
    ]
  },
  {
    key: '2',
    title: '技术FAQ',
    children: [
      { key: '2-1', title: '安装部署', parentKey: '2' },
      { key: '2-2', title: '故障排查', parentKey: '2' }
    ]
  },
  {
    key: '3',
    title: '账户FAQ',
    children: [
      { key: '3-1', title: '登录认证', parentKey: '3' },
      { key: '3-2', title: '权限设置', parentKey: '3' }
    ]
  }
]);

// 设置初始数据
watchEffect(() => {
  if (props.initialData) {
    treeData.value = props.initialData;
  }
});

// 选中的节点
const selectedKeys = ref<string[]>([]);
const expandedKeys = ref<string[]>([]);

// 分类表单
const categoryFormRef = ref<FormInstance>();
const categoryModalVisible = ref(false);
const categoryModalTitle = ref('新建分类');
const categoryForm = reactive({
  key: '',
  name: '',
  description: '',
  parentKey: undefined as string | undefined
});
const categoryRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
};

// 删除弹窗
const deleteModalVisible = ref(false);
const categoryToDelete = ref<CategoryItem>();
const hasChildrenOrFAQs = ref(false);

// 选择分类节点
const handleSelect = (selectedKeys: string[], e: any) => {
  if (selectedKeys.length > 0) {
    const key = selectedKeys[0];
    emit('select', key, findNodeByKey(treeData.value, key));
  }
};

// 展开/收起分类
const handleExpand = (expandedKeysParam: string[]) => {
  expandedKeys.value = expandedKeysParam;
};

// 添加根分类
const handleAddRootCategory = () => {
  categoryModalTitle.value = '新建分类';
  categoryForm.key = '';
  categoryForm.name = '';
  categoryForm.description = '';
  categoryForm.parentKey = undefined;
  categoryModalVisible.value = true;
};

// 添加子分类
const handleAddSubCategory = (parentKey: string) => {
  categoryModalTitle.value = '新建子分类';
  categoryForm.key = '';
  categoryForm.name = '';
  categoryForm.description = '';
  categoryForm.parentKey = parentKey;
  categoryModalVisible.value = true;
};

// 编辑分类
const handleEditCategory = (key: string) => {
  const node = findNodeByKey(treeData.value, key);
  if (node) {
    categoryModalTitle.value = '编辑分类';
    categoryForm.key = node.key;
    categoryForm.name = node.title as string;
    categoryForm.description = node.description || '';
    categoryForm.parentKey = node.parentKey;
    categoryModalVisible.value = true;
  }
};

// 删除分类
const handleDeleteCategory = (key: string) => {
  const node = findNodeByKey(treeData.value, key);
  if (node) {
    categoryToDelete.value = node;
    
    // 检查是否有子分类或FAQ
    hasChildrenOrFAQs.value = !!(node.children && node.children.length > 0);
    
    deleteModalVisible.value = true;
  }
};

// 确认删除分类
const confirmDeleteCategory = () => {
  if (categoryToDelete.value) {
    emit('delete-category', categoryToDelete.value.key);
    
    // 在本地更新树结构
    const newTreeData = removeNode(treeData.value, categoryToDelete.value.key);
    treeData.value = newTreeData;
    
    deleteModalVisible.value = false;
    message.success(`分类 "${categoryToDelete.value.title}" 已删除`);
    
    // 如果删除的是当前选中的分类，需要清空选中状态
    if (selectedKeys.value.includes(categoryToDelete.value.key)) {
      selectedKeys.value = [];
      emit('select', '', null);
    }
  }
};

// 提交分类表单
const handleCategoryModalOk = () => {
  categoryFormRef.value?.validate().then(() => {
    const isEdit = !!categoryForm.key;
    
    if (isEdit) {
      // 编辑现有分类
      const newTreeData = updateNode(treeData.value, categoryForm.key, {
        title: categoryForm.name,
        description: categoryForm.description
      });
      
      treeData.value = newTreeData;
      emit('edit-category', {
        key: categoryForm.key,
        title: categoryForm.name,
        description: categoryForm.description
      });
      
      message.success(`分类 "${categoryForm.name}" 已更新`);
    } else {
      // 添加新分类
      const newKey = `cat-${Date.now()}`;
      const newNode: CategoryItem = {
        key: newKey,
        title: categoryForm.name,
        description: categoryForm.description,
        parentKey: categoryForm.parentKey,
        children: []
      };
      
      if (categoryForm.parentKey) {
        // 添加子分类
        const newTreeData = addChildNode(treeData.value, categoryForm.parentKey, newNode);
        treeData.value = newTreeData;
      } else {
        // 添加根分类
        treeData.value = [...treeData.value, newNode];
      }
      
      emit('add-category', newNode);
      message.success(`分类 "${categoryForm.name}" 已创建`);
      
      // 展开父节点
      if (categoryForm.parentKey && !expandedKeys.value.includes(categoryForm.parentKey)) {
        expandedKeys.value = [...expandedKeys.value, categoryForm.parentKey];
      }
    }
    
    // 向父组件提交更新后的树数据
    emit('update:treeData', toRaw(treeData.value));
    
    categoryModalVisible.value = false;
  }).catch(err => {
    console.error('表单验证失败:', err);
  });
};

// 查找节点
const findNodeByKey = (nodes: CategoryItem[], key: string): CategoryItem | undefined => {
  for (const node of nodes) {
    if (node.key === key) {
      return node;
    }
    if (node.children) {
      const found = findNodeByKey(node.children, key);
      if (found) return found;
    }
  }
  return undefined;
};

// 添加子节点
const addChildNode = (nodes: CategoryItem[], parentKey: string, newNode: CategoryItem): CategoryItem[] => {
  return nodes.map(node => {
    if (node.key === parentKey) {
      return {
        ...node,
        children: [...(node.children || []), newNode]
      };
    }
    if (node.children) {
      return {
        ...node,
        children: addChildNode(node.children, parentKey, newNode)
      };
    }
    return node;
  });
};

// 更新节点
const updateNode = (nodes: CategoryItem[], key: string, updates: Partial<CategoryItem>): CategoryItem[] => {
  return nodes.map(node => {
    if (node.key === key) {
      return { ...node, ...updates };
    }
    if (node.children) {
      return {
        ...node,
        children: updateNode(node.children, key, updates)
      };
    }
    return node;
  });
};

// 删除节点
const removeNode = (nodes: CategoryItem[], key: string): CategoryItem[] => {
  return nodes.filter(node => node.key !== key).map(node => {
    if (node.children) {
      return {
        ...node,
        children: removeNode(node.children, key)
      };
    }
    return node;
  });
};
</script>

<style lang="scss" scoped>
.faq-category-tree {
  height: 100%;
  border-right: 1px solid #f0f0f0;
  
  .tree-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    margin-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;
    
    h3 {
      margin: 0;
      font-size: 16px;
    }
  }
  
  .tree-node {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 4px 0;
    
    .node-title {
      flex: 1;
    }
    
    .node-actions {
      display: none;
      margin-left: 8px;
    }
    
    &:hover .node-actions {
      display: block;
    }
    
    .action-icon {
      cursor: pointer;
      font-size: 16px;
      
      &:hover {
        color: #1890ff;
      }
    }
  }
  
  :deep(.ant-tree-treenode) {
    width: 100%;
    padding-right: 8px !important;
  }
  
  .warning-text {
    color: #ff4d4f;
  }
}
</style> 