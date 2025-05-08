<template>
  <div class="document-directory-tree">
    <div class="tree-header">
      <h3>文档目录</h3>
      <a-button type="link" @click="handleAddRootDirectory">
        <PlusOutlined /> 新建目录
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
                    <a-menu-item key="1" @click="handleAddSubDirectory(key)">
                      <PlusOutlined /> 新建子目录
                    </a-menu-item>
                    <a-menu-item key="2" @click="handleEditDirectory(key)">
                      <EditOutlined /> 编辑
                    </a-menu-item>
                    <a-menu-item key="3" @click="handleDeleteDirectory(key)">
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

    <!-- 添加/编辑目录弹窗 -->
    <a-modal
      v-model:visible="directoryModalVisible"
      :title="directoryModalTitle"
      @ok="handleDirectoryModalOk"
      @cancel="directoryModalVisible = false"
    >
      <a-form
        :model="directoryForm"
        :rules="directoryRules"
        ref="directoryFormRef"
      >
        <a-form-item label="目录名称" name="name">
          <a-input v-model:value="directoryForm.name" placeholder="请输入目录名称" />
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-textarea 
            v-model:value="directoryForm.description" 
            placeholder="请输入目录描述（选填）" 
            :rows="3" 
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 删除确认弹窗 -->
    <a-modal
      v-model:visible="deleteModalVisible"
      title="删除目录"
      okText="删除"
      okType="danger"
      @ok="confirmDeleteDirectory"
      @cancel="deleteModalVisible = false"
    >
      <p>确定要删除目录 "{{ directoryToDelete?.title }}" 吗？</p>
      <p v-if="hasChildrenOrDocuments" class="warning-text">
        该目录下包含子目录或文档，删除后将无法恢复！
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

interface DirectoryItem extends TreeDataItem {
  key: string;
  title: string;
  parentKey?: string;
  children?: DirectoryItem[];
  description?: string;
}

// 定义组件属性
const props = defineProps<{
  initialData?: DirectoryItem[];
  loading?: boolean;
}>();

// 定义事件
const emit = defineEmits([
  'select',
  'update:treeData',
  'add-directory',
  'edit-directory',
  'delete-directory'
]);

// 树形数据
const treeData = ref<DirectoryItem[]>([
  {
    key: '1',
    title: '产品文档',
    children: [
      { key: '1-1', title: '产品规格说明', parentKey: '1' },
      { key: '1-2', title: '使用手册', parentKey: '1' }
    ]
  },
  {
    key: '2',
    title: '工艺文档',
    children: [
      { key: '2-1', title: '工艺标准', parentKey: '2' },
      { key: '2-2', title: '操作规程', parentKey: '2' }
    ]
  },
  {
    key: '3',
    title: '管理制度',
    children: [
      { key: '3-1', title: '人事制度', parentKey: '3' },
      { key: '3-2', title: '财务制度', parentKey: '3' }
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

// 目录表单
const directoryFormRef = ref<FormInstance>();
const directoryModalVisible = ref(false);
const directoryModalTitle = ref('新建目录');
const directoryForm = reactive({
  key: '',
  name: '',
  description: '',
  parentKey: undefined as string | undefined
});
const directoryRules = {
  name: [{ required: true, message: '请输入目录名称', trigger: 'blur' }]
};

// 删除弹窗
const deleteModalVisible = ref(false);
const directoryToDelete = ref<DirectoryItem>();
const hasChildrenOrDocuments = ref(false);

// 选择目录节点
const handleSelect = (selectedKeys: string[], e: any) => {
  if (selectedKeys.length > 0) {
    const key = selectedKeys[0];
    emit('select', key, findNodeByKey(treeData.value, key));
  }
};

// 展开/收起目录
const handleExpand = (expandedKeysParam: string[]) => {
  expandedKeys.value = expandedKeysParam;
};

// 添加根目录
const handleAddRootDirectory = () => {
  directoryModalTitle.value = '新建目录';
  directoryForm.key = '';
  directoryForm.name = '';
  directoryForm.description = '';
  directoryForm.parentKey = undefined;
  directoryModalVisible.value = true;
};

// 添加子目录
const handleAddSubDirectory = (parentKey: string) => {
  directoryModalTitle.value = '新建子目录';
  directoryForm.key = '';
  directoryForm.name = '';
  directoryForm.description = '';
  directoryForm.parentKey = parentKey;
  directoryModalVisible.value = true;
};

// 编辑目录
const handleEditDirectory = (key: string) => {
  const node = findNodeByKey(treeData.value, key);
  if (node) {
    directoryModalTitle.value = '编辑目录';
    directoryForm.key = node.key;
    directoryForm.name = node.title as string;
    directoryForm.description = node.description || '';
    directoryForm.parentKey = node.parentKey;
    directoryModalVisible.value = true;
  }
};

// 删除目录
const handleDeleteDirectory = (key: string) => {
  const node = findNodeByKey(treeData.value, key);
  if (node) {
    directoryToDelete.value = node;
    
    // 检查是否有子目录或文档
    hasChildrenOrDocuments.value = !!(node.children && node.children.length > 0);
    
    deleteModalVisible.value = true;
  }
};

// 确认删除目录
const confirmDeleteDirectory = () => {
  if (directoryToDelete.value) {
    emit('delete-directory', directoryToDelete.value.key);
    
    // 在本地更新树结构
    const newTreeData = removeNode(treeData.value, directoryToDelete.value.key);
    treeData.value = newTreeData;
    
    deleteModalVisible.value = false;
    message.success(`目录 "${directoryToDelete.value.title}" 已删除`);
    
    // 如果删除的是当前选中的目录，需要清空选中状态
    if (selectedKeys.value.includes(directoryToDelete.value.key)) {
      selectedKeys.value = [];
      emit('select', '', null);
    }
  }
};

// 提交目录表单
const handleDirectoryModalOk = () => {
  directoryFormRef.value?.validate().then(() => {
    const isEdit = !!directoryForm.key;
    
    if (isEdit) {
      // 编辑现有目录
      const newTreeData = updateNode(treeData.value, directoryForm.key, {
        title: directoryForm.name,
        description: directoryForm.description
      });
      
      treeData.value = newTreeData;
      emit('edit-directory', {
        key: directoryForm.key,
        title: directoryForm.name,
        description: directoryForm.description
      });
      
      message.success(`目录 "${directoryForm.name}" 已更新`);
    } else {
      // 添加新目录
      const newKey = `dir-${Date.now()}`;
      const newNode: DirectoryItem = {
        key: newKey,
        title: directoryForm.name,
        description: directoryForm.description,
        parentKey: directoryForm.parentKey,
        children: []
      };
      
      if (directoryForm.parentKey) {
        // 添加子目录
        const newTreeData = addChildNode(treeData.value, directoryForm.parentKey, newNode);
        treeData.value = newTreeData;
      } else {
        // 添加根目录
        treeData.value = [...treeData.value, newNode];
      }
      
      emit('add-directory', newNode);
      message.success(`目录 "${directoryForm.name}" 已创建`);
      
      // 展开父节点
      if (directoryForm.parentKey && !expandedKeys.value.includes(directoryForm.parentKey)) {
        expandedKeys.value = [...expandedKeys.value, directoryForm.parentKey];
      }
    }
    
    // 向父组件提交更新后的树数据
    emit('update:treeData', toRaw(treeData.value));
    
    directoryModalVisible.value = false;
  }).catch(err => {
    console.error('表单验证失败:', err);
  });
};

// 查找节点
const findNodeByKey = (nodes: DirectoryItem[], key: string): DirectoryItem | undefined => {
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
const addChildNode = (nodes: DirectoryItem[], parentKey: string, newNode: DirectoryItem): DirectoryItem[] => {
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
const updateNode = (nodes: DirectoryItem[], key: string, updates: Partial<DirectoryItem>): DirectoryItem[] => {
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
const removeNode = (nodes: DirectoryItem[], key: string): DirectoryItem[] => {
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
.document-directory-tree {
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