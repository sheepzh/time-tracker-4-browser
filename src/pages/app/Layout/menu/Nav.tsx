/**
 * Copyright (c) 2024-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { getUrl } from "@api/chrome/runtime"
import { t } from "@app/locale"
import { CloseBold, Link, Menu } from "@element-plus/icons-vue"
import { css } from '@emotion/css'
import { useSwitch } from "@hooks"
import Flex from '@pages/components/Flex'
import { ElBreadcrumb, ElBreadcrumbItem, ElIcon, ElMenu, ElMenuItem, useNamespace } from "element-plus"
import { defineComponent, h, onBeforeMount, ref, watch } from "vue"
import { useRouter } from "vue-router"
import { type MenuItem, NAV_MENUS } from "./item"
import { handleClick, initTitle } from "./route"
import { colorMenu } from './style'

const HEADER_HEIGHT = 'var(--el-header-height)'

const useStyle = () => {
    const menuNs = useNamespace('menu')
    const containerCls = css`
        height: 100%;
        background: var(${colorMenu('bg')});
        color: var(${colorMenu('text')});
        padding-inline: 20px;
    `
    const menuWrapperCls = css`
        position: absolute;
        top: calc(${HEADER_HEIGHT} - 1px);
        left: 0;
        width: 100vw;
        z-index: 9999;
        max-height: calc(100vh - ${HEADER_HEIGHT});
        & .${menuNs.b()} {
            padding-bottom: 10px;
        }
    `
    return { containerCls, menuWrapperCls }
}

const findTitle = (routePath: string): string => {
    const title = NAV_MENUS.find(v => routePath === v.route)?.title
    return title ? t(title) : ''
}

const _default = defineComponent<{}>(() => {
    const router = useRouter()
    const title = ref('')
    const [showMenu, , closeMenu, toggleMenu] = useSwitch(false)
    const handleItemClick = (item: MenuItem) => {
        handleClick(item, router)
        closeMenu()
    }

    const syncRouter = () => {
        const route = router.currentRoute.value
        route && (title.value = findTitle(route.path))
    }

    watch(router.currentRoute, syncRouter)

    onBeforeMount(() => initTitle(router))
    const { containerCls, menuWrapperCls } = useStyle()

    return () => (
        <div class={containerCls}>
            <Flex justify='space-between' align='center' height={HEADER_HEIGHT}>
                <Flex gap={20} align='center'>
                    <ElIcon>
                        <img width='32' height='32' src={getUrl('static/images/icon.png')} />
                    </ElIcon>
                    <ElBreadcrumb separator="/">
                        <ElBreadcrumbItem>{t(msg => msg.meta.name)}</ElBreadcrumbItem>
                        {!!title.value && <ElBreadcrumbItem>{title.value}</ElBreadcrumbItem>}
                    </ElBreadcrumb>
                </Flex>
                <div onClick={toggleMenu}>
                    <ElIcon size="large">
                        {showMenu.value ? <CloseBold /> : <Menu />}
                    </ElIcon>
                </div>
            </Flex>
            <div class={menuWrapperCls} v-show={showMenu.value}>
                <ElMenu>
                    {NAV_MENUS.map(item => (
                        <ElMenuItem
                            index={item.index ?? item.route ?? item.href}
                            onClick={() => handleItemClick(item)}
                        >
                            <ElIcon>
                                {h(item.icon)}
                            </ElIcon>
                            <span>{t(item.title)}</span>
                            {!!item.href && <ElIcon size={12}><Link /></ElIcon>}
                        </ElMenuItem>
                    ))}
                </ElMenu>
            </div>
        </div>
    )
})

export default _default