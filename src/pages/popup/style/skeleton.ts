import { injectGlobal } from '@emotion/css'
import { injectCommonCss } from './common'

export const injectSkeletonCss = () => {
    injectCommonCss()

    injectGlobal`
        body {
            width: 0px;
            height: 0px;
            box-sizing: border-box;
            overflow: hidden;
        }

        iframe {
            border: none;
            height: 100%;
            width: 100%;
        }
    `
}