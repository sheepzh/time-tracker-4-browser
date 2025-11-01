import { injectGlobal } from '@emotion/css'
import { injectElementPlusDarkTheme } from '@pages/element-ui/dark-theme'

export const injectGlobalCss = () => {
    injectElementPlusDarkTheme()

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
