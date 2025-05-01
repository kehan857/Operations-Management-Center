import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

// 引入 Ant Design Vue
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'

const app = createApp(App)

// 使用路由和Ant Design Vue
app.use(router)
app.use(Antd)

app.mount('#app')
