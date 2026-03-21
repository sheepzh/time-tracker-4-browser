import { injectGlobal } from '@emotion/css'
import '@pages/element-ui/dark-theme.css'
import "element-plus/theme-chalk/display.css"
import 'element-plus/theme-chalk/index.css'
import { injectEchartsCss } from './echarts'
import { injectElementCss } from './element'

export const injectAppCss = () => {
    injectEchartsCss()
    injectElementCss()

    injectGlobal`
        :root {
            --el-menu-item-height: 48px;
            --el-menu-active-color: var(--el-menu-text-color);
            --el-menu-bg-color: #1d222d;
            --el-menu-text-color: #c1c6c8;
            --el-menu-hover-bg-color: #262f3e;
        }

        body {
            height: 100vh;
            margin: 0;
            text-rendering: optimizeLegibility;
            font-family: Helvetica Neue, Helvetica, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Arial, sans-serif;
        }
    `
}