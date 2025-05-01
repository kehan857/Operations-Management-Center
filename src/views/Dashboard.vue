<template>
  <div class="dashboard">
    <!-- 核心指标卡片组（第一行，紧凑排列） -->
    <a-row :gutter="[8, 8]">
      <a-col :xs="12" :sm="8" :md="8" :lg="6" :xl="4" v-for="(card, index) in metricCards" :key="index">
        <a-card hoverable class="metric-card" @click="card.action">
          <div class="metric-content">
            <div class="metric-icon" :class="{'alert': card.alert}">
              <component :is="card.icon" />
            </div>
            <div class="metric-info">
              <div class="metric-title">{{ card.title }}</div>
              <div class="metric-value" :class="{'alert': card.alert}">{{ card.value }}</div>
              <div class="metric-trend">
                <template v-if="card.trendType === 'progress'">
                  <a-progress :percent="card.trend" :showInfo="false" size="small" />
                </template>
                <template v-else>
                  <span class="trend-value" :class="card.trendDirection">{{ card.trend }}</span>
                  <span class="trend-text">{{ card.trendText }}</span>
                </template>
              </div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 数据趋势图表区（第二行） -->
    <a-row :gutter="[8, 8]" class="chart-row">
      <a-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
        <a-card title="用户增长趋势" size="small" class="chart-card" :bordered="false">
          <template #extra>
            <a-radio-group v-model:value="userChartRange" size="small" button-style="solid">
              <a-radio-button value="7d">7天</a-radio-button>
              <a-radio-button value="30d">30天</a-radio-button>
            </a-radio-group>
          </template>
          <div class="chart-container">
            <div ref="userChartRef" style="height: 180px; width: 100%"></div>
          </div>
        </a-card>
      </a-col>
      
      <a-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
        <a-card title="收入趋势" size="small" class="chart-card" :bordered="false">
          <template #extra>
            <a-radio-group v-model:value="incomeChartRange" size="small" button-style="solid">
              <a-radio-button value="6m">6个月</a-radio-button>
              <a-radio-button value="12m">12个月</a-radio-button>
            </a-radio-group>
          </template>
          <div class="chart-container">
            <div ref="incomeChartRef" style="height: 180px; width: 100%"></div>
          </div>
        </a-card>
      </a-col>
      
      <a-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
        <a-card title="Agent调用量" size="small" class="chart-card" :bordered="false">
          <template #extra>
            <a-radio-group v-model:value="agentChartRange" size="small" button-style="solid">
              <a-radio-button value="24h">24小时</a-radio-button>
              <a-radio-button value="7d">7天</a-radio-button>
            </a-radio-group>
          </template>
          <div class="chart-container">
            <div ref="agentChartRef" style="height: 180px; width: 100%"></div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 操作数据区（第三行，左右分栏） -->
    <a-row :gutter="[8, 8]">
      <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <a-card title="最近订单" size="small" class="data-card" :bordered="false">
          <template #extra>
            <a href="javascript:;" @click="goToOrders">查看更多</a>
          </template>
          <a-table
            :columns="orderColumns"
            :data-source="recentOrders"
            :pagination="false"
            size="small"
            :scroll="{ y: 200 }"
            :rowKey="(record) => record.id"
          />
        </a-card>
      </a-col>
      
      <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <a-card title="待处理事项" size="small" class="data-card" :bordered="false">
          <template #extra>
            <a-badge :count="todoItems.length" :offset="[-5, 5]" />
          </template>
          <a-list :data-source="todoItems" size="small" :pagination="false">
            <template #renderItem="{ item }">
              <a-list-item class="todo-item" @click="handleTodoItem(item)">
                <div class="todo-content">
                  <a-tag
                    :color="item.type === 'urgent' ? '#f5222d' : '#1890ff'"
                    class="todo-tag"
                  >
                    {{ item.type === 'urgent' ? '紧急' : '普通' }}
                  </a-tag>
                  <span class="todo-text">{{ item.content }}</span>
                </div>
                <div class="todo-time">{{ item.time }}</div>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
    </a-row>

    <!-- 系统状态概览区（第四行） -->
    <a-row :gutter="[8, 8]">
      <a-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
        <a-card title="数据更新状态" size="small" class="status-card" :bordered="false">
          <a-timeline>
            <a-timeline-item 
              v-for="(item, index) in dataSyncStatus" 
              :key="index"
              :color="item.status === 'success' ? 'green' : item.status === 'processing' ? 'blue' : 'red'"
            >
              <div class="status-item">
                <span>{{ item.source }}</span>
                <span class="status-time">{{ item.time }}</span>
              </div>
            </a-timeline-item>
          </a-timeline>
        </a-card>
      </a-col>
      
      <a-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
        <a-card title="API调用统计" size="small" class="status-card" :bordered="false">
          <div class="api-status">
            <div class="api-calls">
              <div class="api-number">15,432</div>
              <div class="api-label">24小时调用量</div>
            </div>
            <div class="api-success">
              <a-progress type="circle" :percent="96" :width="70" />
              <div class="api-label">成功率</div>
            </div>
          </div>
        </a-card>
      </a-col>
      
      <a-col :xs="24" :sm="12" :md="8" :lg="8" :xl="8">
        <a-card title="系统资源使用率" size="small" class="status-card" :bordered="false">
          <div class="resource-item">
            <div class="resource-label">存储空间</div>
            <a-progress :percent="65" :showInfo="false" />
            <div class="resource-value">65% (1.95TB/3TB)</div>
          </div>
          <div class="resource-item">
            <div class="resource-label">计算资源</div>
            <a-progress :percent="42" :showInfo="false" />
            <div class="resource-value">42% (21/50 vCPU)</div>
          </div>
          <div class="resource-item">
            <div class="resource-label">内存使用</div>
            <a-progress :percent="78" :showInfo="false" />
            <div class="resource-value">78% (125GB/160GB)</div>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, h, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { Tag } from 'ant-design-vue'
import {
  TeamOutlined,
  SafetyCertificateOutlined,
  ShoppingOutlined,
  RiseOutlined,
  RobotOutlined,
  BookOutlined
} from '@ant-design/icons-vue'

const router = useRouter()

// 指标卡片数据
const metricCards = [
  {
    title: '总用户数',
    value: '1,234',
    trend: '+12%',
    trendDirection: 'up',
    trendText: '较上月',
    trendType: 'text',
    icon: TeamOutlined,
    alert: false,
    action: goToUsers
  },
  {
    title: '待审核企业',
    value: '56',
    trend: '+8',
    trendDirection: 'up',
    trendText: '今日新增',
    trendType: 'text',
    icon: SafetyCertificateOutlined,
    alert: true,
    action: goToVerification
  },
  {
    title: '本月订单数',
    value: '89',
    trend: '-5%',
    trendDirection: 'down',
    trendText: '较上月',
    trendType: 'text',
    icon: ShoppingOutlined,
    alert: false,
    action: goToOrders
  },
  {
    title: '月收入(万元)',
    value: '23.5',
    trend: '+15%',
    trendDirection: 'up',
    trendText: '较上月',
    trendType: 'text',
    icon: RiseOutlined,
    alert: false,
    action: goToOrders
  },
  {
    title: '活跃Agent数',
    value: '42',
    trend: '+3',
    trendDirection: 'up',
    trendText: '今日新增',
    trendType: 'text',
    icon: RobotOutlined,
    alert: false,
    action: goToAgents
  },
  {
    title: '知识库状态',
    value: '245/300',
    trend: 82,
    trendType: 'progress',
    icon: BookOutlined,
    alert: false,
    action: goToKnowledge
  }
]

// 图表时间范围
const userChartRange = ref('30d')
const incomeChartRange = ref('6m')
const agentChartRange = ref('7d')

// 图表引用
const userChartRef = ref<HTMLElement | null>(null)
const incomeChartRef = ref<HTMLElement | null>(null)
const agentChartRef = ref<HTMLElement | null>(null)

// 图表实例
let userChart: echarts.ECharts | null = null
let incomeChart: echarts.ECharts | null = null
let agentChart: echarts.ECharts | null = null

// 订单表格列定义
const orderColumns = [
  { title: '订单号', dataIndex: 'id', key: 'id', width: '20%', ellipsis: true },
  { title: '客户名称', dataIndex: 'customer', key: 'customer', width: '25%', ellipsis: true },
  { title: '用户ID', dataIndex: 'userId', key: 'userId', width: '15%', ellipsis: true },
  { title: '金额', dataIndex: 'amount', key: 'amount', width: '15%', align: 'right' },
  { 
    title: '状态', 
    dataIndex: 'status', 
    key: 'status', 
    width: '15%',
    customRender: (options: { text: string }) => {
      const color = options.text === '已完成' ? 'success' : options.text === '处理中' ? 'processing' : 'warning'
      return h(Tag, { color }, options.text)
    }
  },
  {
    title: '操作',
    key: 'operation',
    width: '10%',
    customRender: () => h('a', {}, '详情')
  }
]

// 最近订单数据
const recentOrders = ref([
  { id: 'ORD20240426001', customer: '企业A科技有限公司', userId: 'U1001', amount: '¥5,000', status: '已完成' },
  { id: 'ORD20240426002', customer: '企业B信息技术', userId: 'U1254', amount: '¥3,000', status: '处理中' },
  { id: 'ORD20240425008', customer: '企业C网络科技', userId: 'U2150', amount: '¥8,000', status: '待支付' },
  { id: 'ORD20240425007', customer: '企业D数据服务', userId: 'U3021', amount: '¥12,500', status: '已完成' },
  { id: 'ORD20240424015', customer: '企业E智能科技', userId: 'U1892', amount: '¥7,200', status: '已完成' }
])

// 待处理事项
const todoItems = ref([
  { id: 1, type: 'urgent', content: '企业D申请待审核', time: '10分钟前', route: '/verification?id=VER123' },
  { id: 2, type: 'normal', content: '新订单ORD20240426002待处理', time: '30分钟前', route: '/orders?id=ORD20240426002' },
  { id: 3, type: 'urgent', content: '系统升级通知：将于今晚22:00进行维护', time: '1小时前' },
  { id: 4, type: 'normal', content: '用户反馈数据分析报表加载缓慢', time: '2小时前', route: '/feedback' },
  { id: 5, type: 'normal', content: '知识库新增50篇文档待处理', time: '3小时前', route: '/knowledge-management' }
])

// 处理待办事项点击
const handleTodoItem = (item: any) => {
  if (item.route) {
    router.push(item.route)
  }
}

// 数据同步状态
const dataSyncStatus = ref([
  { source: '企业A - CRM系统', status: 'success', time: '10分钟前' },
  { source: '企业B - ERP系统', status: 'processing', time: '正在同步' },
  { source: '企业C - 销售系统', status: 'success', time: '1小时前' },
  { source: '企业D - 生产系统', status: 'error', time: '同步失败' }
])

// 导航函数
function goToVerification() {
  router.push('/verification')
}

function goToUsers() {
  router.push('/users')
}

function goToOrders() {
  router.push('/orders')
}

function goToAgents() {
  router.push('/agent-management')
}

function goToKnowledge() {
  router.push('/knowledge-management')
}

// 响应窗口大小变化，重新绘制图表
const handleResize = () => {
  userChart?.resize()
  incomeChart?.resize()
  agentChart?.resize()
}

// 初始化图表
onMounted(() => {
  // 用户增长趋势图表
  if (userChartRef.value) {
    userChart = echarts.init(userChartRef.value)
    userChart.setOption({
      color: ['#1890ff'],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['4.20', '4.21', '4.22', '4.23', '4.24', '4.25', '4.26'],
        axisLine: {
          lineStyle: {
            color: '#E5E7EB'
          }
        },
        axisLabel: {
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        splitLine: {
          lineStyle: {
            color: '#F3F4F6'
          }
        },
        axisLabel: {
          fontSize: 10
        }
      },
      tooltip: {
        trigger: 'axis'
      },
      series: [
        {
          name: '新增用户',
          type: 'line',
          smooth: true,
          data: [30, 40, 35, 50, 45, 65, 55],
          areaStyle: {
            opacity: 0.1
          }
        }
      ]
    })
  }
  
  // 收入趋势图表
  if (incomeChartRef.value) {
    incomeChart = echarts.init(incomeChartRef.value)
    incomeChart.setOption({
      color: ['#52c41a'],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['11月', '12月', '1月', '2月', '3月', '4月'],
        axisLine: {
          lineStyle: {
            color: '#E5E7EB'
          }
        },
        axisLabel: {
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        splitLine: {
          lineStyle: {
            color: '#F3F4F6'
          }
        },
        axisLabel: {
          fontSize: 10
        }
      },
      tooltip: {
        trigger: 'axis'
      },
      series: [
        {
          name: '月收入(万元)',
          type: 'bar',
          barWidth: '60%',
          data: [18.5, 20.1, 15.7, 19.2, 21.8, 23.5]
        }
      ]
    })
  }
  
  // Agent调用量图表
  if (agentChartRef.value) {
    agentChart = echarts.init(agentChartRef.value)
    agentChart.setOption({
      color: ['#722ed1'],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['4.20', '4.21', '4.22', '4.23', '4.24', '4.25', '4.26'],
        axisLine: {
          lineStyle: {
            color: '#E5E7EB'
          }
        },
        axisLabel: {
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        splitLine: {
          lineStyle: {
            color: '#F3F4F6'
          }
        },
        axisLabel: {
          fontSize: 10
        }
      },
      tooltip: {
        trigger: 'axis'
      },
      series: [
        {
          name: 'Agent调用次数',
          type: 'line',
          smooth: true,
          data: [1200, 1350, 1800, 1420, 1650, 2100, 1950],
          areaStyle: {
            opacity: 0.2
          }
        }
      ]
    })
  }

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

// 组件销毁时清理图表实例和事件监听
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  userChart?.dispose()
  incomeChart?.dispose()
  agentChart?.dispose()
})

// 监听图表范围变化
watch(userChartRange, (newValue: string) => {
  // 这里可以根据时间范围请求新数据并更新图表
  console.log('用户图表范围变化:', newValue)
})

watch(incomeChartRange, (newValue: string) => {
  console.log('收入图表范围变化:', newValue)
})

watch(agentChartRange, (newValue: string) => {
  console.log('Agent图表范围变化:', newValue)
})
</script>

<style lang="scss" scoped>
.dashboard {
  .a-row {
    margin-bottom: 8px !important;
  }
  
  // 核心指标卡片样式
  .metric-card {
    height: 90px;
    margin-bottom: 0;
    
    :deep(.ant-card-body) {
      padding: 10px;
    }
    
    .metric-content {
      display: flex;
      align-items: center;
    }
    
    .metric-icon {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 36px;
      height: 36px;
      background: #e6f7ff;
      color: #1890ff;
      border-radius: 6px;
      font-size: 20px;
      margin-right: 10px;
      
      &.alert {
        background: #fff2e8;
        color: #fa8c16;
      }
    }
    
    .metric-info {
      flex: 1;
      overflow: hidden;
    }
    
    .metric-title {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .metric-value {
      font-size: 22px;
      font-weight: 500;
      color: #1f2937;
      font-family: DIN, sans-serif;
      line-height: 1.2;
      
      &.alert {
        color: #fa8c16;
      }
    }
    
    .metric-trend {
      display: flex;
      align-items: center;
      font-size: 12px;
      margin-top: 2px;
      
      .trend-value {
        &.up {
          color: #52c41a;
        }
        
        &.down {
          color: #f5222d;
        }
      }
      
      .trend-text {
        color: #9ca3af;
        margin-left: 4px;
      }
    }
  }
  
  // 图表卡片样式
  .chart-row {
    margin-top: 8px;
  }
  
  .chart-card {
    margin-bottom: 0;
    
    :deep(.ant-card-head) {
      min-height: 36px;
      padding: 0 10px;
      
      .ant-card-head-title,
      .ant-card-extra {
        padding: 6px 0;
      }
    }
    
    :deep(.ant-card-body) {
      padding: 10px;
    }
  }
  
  // 数据卡片样式
  .data-card {
    margin-bottom: 0;
    
    :deep(.ant-card-head) {
      min-height: 36px;
      padding: 0 10px;
      
      .ant-card-head-title,
      .ant-card-extra {
        padding: 6px 0;
      }
    }
    
    :deep(.ant-card-body) {
      padding: 0;
    }
    
    :deep(.ant-table-thead > tr > th) {
      padding: 6px;
      background: #f9fafb;
      font-size: 12px;
    }
    
    :deep(.ant-table-tbody > tr > td) {
      padding: 4px 6px;
      font-size: 12px;
    }
    
    .todo-item {
      padding: 6px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      
      &:hover {
        background-color: #f5f5f5;
      }
    }
    
    .todo-content {
      display: flex;
      align-items: center;
      max-width: 75%;
      overflow: hidden;
    }
    
    .todo-tag {
      margin-right: 6px;
      font-size: 10px;
      line-height: 1.2;
      padding: 1px 4px;
    }
    
    .todo-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 12px;
    }
    
    .todo-time {
      font-size: 11px;
      color: #9ca3af;
      min-width: 60px;
      text-align: right;
    }
  }
  
  // 状态卡片样式
  .status-card {
    margin-bottom: 0;
    
    :deep(.ant-card-head) {
      min-height: 36px;
      padding: 0 10px;
      
      .ant-card-head-title,
      .ant-card-extra {
        padding: 6px 0;
      }
    }
    
    :deep(.ant-card-body) {
      padding: 10px;
    }
    
    :deep(.ant-timeline) {
      padding-left: 10px;
      font-size: 12px;
    }
    
    :deep(.ant-timeline-item) {
      padding-bottom: 10px;
    }
    
    .status-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
    }
    
    .status-time {
      color: #9ca3af;
      font-size: 11px;
    }
    
    .api-status {
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding: 6px 0;
    }
    
    .api-calls {
      text-align: center;
    }
    
    .api-number {
      font-size: 22px;
      font-weight: 500;
      color: #1f2937;
      font-family: DIN, sans-serif;
    }
    
    .api-label {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 2px;
    }
    
    .api-success {
      text-align: center;
    }
    
    .resource-item {
      margin-bottom: 10px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    .resource-label {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 2px;
    }
    
    .resource-value {
      font-size: 11px;
      color: #9ca3af;
      text-align: right;
      margin-top: 2px;
    }
  }
  
  @media (max-width: 576px) {
    .metric-card {
      height: 80px;
    }
    
    .metric-icon {
      width: 32px;
      height: 32px;
      font-size: 18px;
      margin-right: 8px;
    }
    
    .metric-value {
      font-size: 18px;
    }
  }
}
</style>