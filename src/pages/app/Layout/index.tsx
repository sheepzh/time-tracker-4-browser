/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { initAppContext } from "@app/context"
import { ElAside, ElContainer, ElHeader } from "element-plus"
import { defineComponent, type StyleValue } from "vue"
import { RouterView } from "vue-router"
import HeadNav from "./menu/Nav"
import SideMenu from "./menu/Side"

const HEADER_STYLE: StyleValue = {
    padding: 0,
    height: 'fit-content',
}

const CONTAINER_STYLE: StyleValue = {
    width: '100%',
    margin: 'auto',
    background: 'var(--timer-app-container-bg-color)',
}

const _default = defineComponent(() => {
    const { layout } = initAppContext()

    return () => (
        <ElContainer style={{ height: '100vh', width: '100vw' }}>
            <ElHeader v-show={layout.value === 'nav'} style={HEADER_STYLE}>
                <HeadNav />
            </ElHeader>
            <ElContainer>
                <ElAside v-show={layout.value === 'sidebar'} style={{ width: 'fit-content' }}>
                    <SideMenu />
                </ElAside>
                <ElContainer style={CONTAINER_STYLE}>
                    <RouterView />
                </ElContainer>
            </ElContainer>
        </ElContainer>
    )
})

export default _default