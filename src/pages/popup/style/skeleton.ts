import { getCurrentZoomSettings } from '@api/chrome/tab'
import { injectGlobal } from '@emotion/css'
import { injectCommonCss } from './common'

export const injectSkeletonCss = async () => {
    injectCommonCss()

    injectGlobal`
        body {
            width: 766px;
            height: 596px;
            box-sizing: border-box;
            overflow: hidden;
        }

        iframe {
            border: none;
            height: 100%;
            width: 100%;
        }
    `

    const { defaultZoomFactor } = await getCurrentZoomSettings()
    defaultZoomFactor && document.body.style.setProperty('zoom', `${1 / defaultZoomFactor}`)
}