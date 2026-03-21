import { injectGlobal } from '@emotion/css'
import '@pages/element-ui/dark-theme.css'
import { injectCommonCss } from './common'
import { injectDarkTheme } from './dark-theme'

export const injectGlobalCss = () => {
    injectCommonCss()
    injectDarkTheme()

    injectGlobal`
        body {
            padding: 10px;
            box-sizing: border-box;
            height: 596px;
            width: 766px;
            overflow: hidden;
        }

        #app {
            overflow: hidden;
            width: 100%;
            height: 100%;
        }
    `
}