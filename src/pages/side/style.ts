import { injectGlobal } from '@emotion/css'
import '@pages/element-ui/dark-theme.css'

export const injectGlobalCss = () => {
    injectGlobal`
        body {
            padding: 18px;
            margin: 0px;
            height: 100vh;
            box-sizing: border-box;
            text-align: unset !important;
            background-color: var(--el-fill-color-dark);
        }
    `
}
