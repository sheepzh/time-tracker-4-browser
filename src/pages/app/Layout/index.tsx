/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { initAppContext } from "@app/context"
import { ElAside, ElContainer, ElHeader, ElScrollbar } from "element-plus"
import { defineComponent, type StyleValue } from "vue"
import { RouterView } from "vue-router"
import HeadNav from "./menu/Nav"
import SideMenu from "./menu/Side"
import "./style.sass"
import VersionTag from "./VersionTag"

const _default = defineComponent(() => {
    const { layout } = initAppContext()

    return () => (
        <ElContainer class="app-layout">
            <ElHeader v-show={layout.value === 'nav'} class='app-header'>
                <HeadNav />
            </ElHeader>
            <ElContainer>
                <ElAside v-show={layout.value === 'sidebar'} style={{ width: '240px' } satisfies StyleValue}>
                    <ElScrollbar>
                        <SideMenu />
                    </ElScrollbar>
                </ElAside>
                <ElContainer class="app-container">
                    <RouterView />
                </ElContainer>
            </ElContainer>
            <VersionTag />
        </ElContainer>
    )
})

export default _default