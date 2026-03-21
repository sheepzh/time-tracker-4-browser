/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { initAppContext } from "@app/context"
import { css, injectGlobal } from '@emotion/css'
import { ElAside, ElContainer, ElHeader, useNamespace } from "element-plus"
import { defineComponent, type StyleValue } from "vue"
import { RouterView } from "vue-router"
import HeadNav from "./menu/Nav"
import SideMenu from "./menu/Side"

const HEADER_STYLE: StyleValue = {
    padding: 0,
    height: 'fit-content',
}

const CONTENT_CLS = css`
    width: 100%;
    margin: auto;
    background: var(--el-fill-color-blank);

    html[data-theme='dark'] & {
        background: var(--el-fill-color-lighter);
    }
`

const injectCss = () => {
    const containerNs = useNamespace('container')
    injectGlobal`
        .${containerNs.b()} {
            height: 100%;
            overflow-y: auto;
        }
    `
}

const _default = defineComponent(() => {
    const { layout } = initAppContext()

    injectCss()

    return () => (
        <ElContainer style={{ height: '100vh', width: '100vw' }}>
            <ElHeader v-show={layout.value === 'nav'} style={HEADER_STYLE}>
                <HeadNav />
            </ElHeader>
            <ElContainer>
                <ElAside v-show={layout.value === 'sidebar'} style={{ width: 'fit-content' }}>
                    <SideMenu />
                </ElAside>
                <ElContainer class={CONTENT_CLS}>
                    <RouterView />
                </ElContainer>
            </ElContainer>
        </ElContainer>
    )
})

export default _default