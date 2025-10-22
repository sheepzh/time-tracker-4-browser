/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { initAppContext } from "@app/context"
import { css } from '@emotion/css'
import { CLZ_HIDDEN_MD_AND_UP, CLZ_HIDDEN_SM_AND_DOWN } from "@pages/element-ui/style"
import { ElAside, ElContainer, ElHeader, ElScrollbar, useNamespace } from "element-plus"
import { defineComponent, type StyleValue } from "vue"
import { RouterView } from "vue-router"
import HeadNav from "./menu/Nav"
import SideMenu from "./menu/Side"
import VersionTag from "./VersionTag"

const _default = defineComponent(() => {
    initAppContext()

    const menuItemNs = useNamespace('menu-item')
    const containerNs = useNamespace('container')
    const containerClz = css`
        height: 100%;
        .${menuItemNs.b()}.is-active {
            background: var(--el-color-primary);
        }
        .${containerNs.b()} {
            height: 100%;
        }
    `
    const headerClz = css`
        background-color: var(--el-menu-bg-color);
        color: var(--el-menu-text-color);
        height: fit-content;
    `
    const contentClz = css`
        width: 100%;
        background: var(--timer-app-container-bg-color);
        margin: auto;
    `

    return () => (
        <ElContainer class={containerClz}>
            <ElHeader class={[headerClz, CLZ_HIDDEN_MD_AND_UP]}>
                <HeadNav />
            </ElHeader>
            <ElContainer>
                <ElAside class={CLZ_HIDDEN_SM_AND_DOWN} style={{ width: '240px' } satisfies StyleValue}>
                    <ElScrollbar>
                        <SideMenu />
                    </ElScrollbar>
                </ElAside>
                <ElContainer class={contentClz}>
                    <RouterView />
                </ElContainer>
            </ElContainer>
            <VersionTag />
        </ElContainer>
    )
})

export default _default