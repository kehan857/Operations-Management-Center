<template>
  <div class="roles-view">
    <a-row :gutter="[16, 16]">
      <a-col :span="8">
        <a-card>
          <template #title>角色列表</template>
          <template #extra>
            <a-button type="primary" @click="showAddRoleModal">
              <template #icon><PlusOutlined /></template>
              添加角色
            </a-button>
          </template>

          <a-list
            :data-source="roles"
            :loading="loading"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta
                  :title="item.name"
                  :description="item.description"
                >
                  <template #avatar>
                    <TeamOutlined />
                  </template>
                </a-list-item-meta>
                <template #actions>
                  <a @click="selectRole(item)">管理</a>
                  <a-popconfirm
                    title="确定要删除该角色吗？"
                    @confirm="deleteRole(item)"
                  >
                    <a style="color: #ff4d4f">删除</a>
                  </a-popconfirm>
                </template>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>

      <a-col :span="16">
        <a-card v-if="selectedRole">
          <template #title>角色配置 - {{ selectedRole.name }}</template>

          <a-tabs v-model:activeKey="activeTab">
            <a-tab-pane key="permissions" tab="权限配置">
              <a-tree
                v-model:checkedKeys="selectedPermissions"
                :tree-data="permissionTree"
                checkable
                :defaultExpandAll="true"
              />
              <div style="margin-top: 16px; text-align: right">
                <a-button type="primary" @click="savePermissions">
                  保存权限配置
                </a-button>
              </div>
            </a-tab-pane>

            <a-tab-pane key="users" tab="用户管理">
              <div style="margin-bottom: 16px">
                <a-input-search
                  v-model:value="userSearchText"
                  placeholder="搜索用户"
                  style="width: 300px"
                  @search="onUserSearch"
                />
              </div>
              <a-table
                :columns="userColumns"
                :data-source="roleUsers"
                :row-selection="{
                  selectedRowKeys: selectedUserKeys,
                  onChange: onUserSelectionChange
                }"
              />
              <div style="margin-top: 16px; text-align: right">
                <a-button type="primary" @click="saveUserAssignments">
                  保存用户分配
                </a-button>
              </div>
            </a-tab-pane>
          </a-tabs>
        </a-card>

        <a-empty v-else description="请选择要管理的角色" />
      </a-col>
    </a-row>

    <!-- 添加角色弹窗 -->
    <a-modal
      v-model:visible="modalVisible"
      title="添加角色"
      @ok="handleModalOk"
    >
      <a-form
        ref="formRef"
        :model="formState"
        :rules="rules"
        layout="vertical"
      >
        <a-form-item label="角色名称" name="name">
          <a-input v-model:value="formState.name" />
        </a-form-item>
        <a-form-item label="角色描述" name="description">
          <a-textarea v-model:value="formState.description" rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { PlusOutlined, TeamOutlined } from '@ant-design/icons-vue'
import type { FormInstance } from 'ant-design-vue'

const loading = ref(false)
const modalVisible = ref(false)
const formRef = ref<FormInstance>()
const selectedRole = ref<any>(null)
const activeTab = ref('permissions')
const userSearchText = ref('')
const selectedPermissions = ref<string[]>([])
const selectedUserKeys = ref<string[]>([])

const roles = ref([
  {
    id: 1,
    name: '系统管理员',
    description: '拥有系统所有权限'
  },
  {
    id: 2,
    name: '运营人员',
    description: '负责日常运营管理'
  },
  {
    id: 3,
    name: '客服人员',
    description: '负责客户服务与支持'
  }
])

const permissionTree = [
  {
    title: '用户管理',
    key: 'users',
    children: [
      { title: '查看用户', key: 'users.view' },
      { title: '创建用户', key: 'users.create' },
      { title: '编辑用户', key: 'users.edit' },
      { title: '删除用户', key: 'users.delete' }
    ]
  },
  {
    title: '企业认证',
    key: 'verification',
    children: [
      { title: '查看认证申请', key: 'verification.view' },
      { title: '审核认证申请', key: 'verification.audit' }
    ]
  },
  {
    title: '订阅管理',
    key: 'subscriptions',
    children: [
      { title: '查看套餐', key: 'subscriptions.view' },
      { title: '管理套餐', key: 'subscriptions.manage' }
    ]
  },
  {
    title: '订单管理',
    key: 'orders',
    children: [
      { title: '查看订单', key: 'orders.view' },
      { title: '处理订单', key: 'orders.process' }
    ]
  }
]

const userColumns = [
  {
    title: '用户名',
    dataIndex: 'username',
    key: 'username'
  },
  {
    title: '姓名',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: '部门',
    dataIndex: 'department',
    key: 'department'
  }
]

const roleUsers = ref([
  {
    id: 'U001',
    username: 'admin',
    name: '管理员',
    department: '技术部'
  },
  {
    id: 'U002',
    username: 'operator',
    name: '运营专员',
    department: '运营部'
  },
  {
    id: 'U003',
    username: 'support',
    name: '客服专员',
    department: '客服部'
  }
])

const formState = reactive({
  name: '',
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入角色名称' }],
  description: [{ required: true, message: '请输入角色描述' }]
}

const showAddRoleModal = () => {
  modalVisible.value = true
  Object.assign(formState, {
    name: '',
    description: ''
  })
}

const handleModalOk = () => {
  formRef.value?.validate().then(() => {
    console.log('form:', formState)
    // 实现添加角色逻辑
    modalVisible.value = false
  })
}

const selectRole = (role: any) => {
  selectedRole.value = role
  // 加载角色权限和用户
  selectedPermissions.value = ['users.view', 'orders.view'] // 示例数据
  selectedUserKeys.value = ['U001'] // 示例数据
}

const deleteRole = (role: any) => {
  console.log('delete role:', role)
  // 实现删除角色逻辑
}

const savePermissions = () => {
  console.log('save permissions:', selectedPermissions.value)
  // 实现保存权限配置逻辑
}

const onUserSearch = (value: string) => {
  console.log('search user:', value)
  // 实现用户搜索逻辑
}

const onUserSelectionChange = (selectedRowKeys: string[]) => {
  selectedUserKeys.value = selectedRowKeys
}

const saveUserAssignments = () => {
  console.log('save user assignments:', selectedUserKeys.value)
  // 实现保存用户分配逻辑
}
</script>

<style lang="less" scoped>
.roles-view {
  .ant-list-item-meta-title {
    margin-bottom: 4px;
  }
}
</style>