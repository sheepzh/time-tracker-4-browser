/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { initAppContext } from "@app/context"
import { CLZ_HIDDEN_MD_AND_UP, CLZ_HIDDEN_SM_AND_DOWN } from "@pages/element-ui/style"
import { ElAside, ElContainer, ElHeader, ElScrollbar } from "element-plus"
import { defineComponent, type StyleValue } from "vue"
import { RouterView } from "vue-router"
import HeadNav from "./menu/Nav"
import SideMenu from "./menu/Side"
import "./style.sass"
import VersionTag from "./VersionTag"

const _default = defineComponent(() => {
    initAppContext()

    return () => (
        <ElContainer class="app-layout">
            <ElHeader class={['app-header', CLZ_HIDDEN_MD_AND_UP]}>
                <HeadNav />
            </ElHeader>
            <ElContainer>
                <ElAside
                    class={CLZ_HIDDEN_SM_AND_DOWN}
                    style={{ width: '240px' } satisfies StyleValue}
                >
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