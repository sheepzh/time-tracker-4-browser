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
import Box from '@pages/components/Box'
import Flex from '@pages/components/Flex'
import { ElBreadcrumb, ElBreadcrumbItem, ElIcon, ElMenu, ElMenuItem, useNamespace } from "element-plus"
import { defineComponent, h, onBeforeMount, ref, watch } from "vue"
import { useRouter } from "vue-router"
import { type MenuItem, NAV_MENUS } from "./item"
import { handleClick, initTitle } from "./route"

const findTitle = (routePath: string): string => {
    const title = NAV_MENUS.find(v => routePath === v.route)?.title
    return title ? t(title) : ''
}

const MenuList = defineComponent<{ onClick: ArgCallback<MenuItem> }>(({ onClick }) => {
    const ns = useNamespace('menu')
    const clz = css`
        position: absolute;
        top: var(--el-header-height);
        left: 0;
        width: 100vw;
        z-index: 9999;
        max-height: calc(100vh - var(--el-header-height));
        .${ns.b()} {
            padding-bottom: 10px;
        }
    `
    return () => (
        <div class={clz}>
            <ElMenu>
                {NAV_MENUS.map(item => (
                    <ElMenuItem onClick={() => onClick(item)}>
                        <ElIcon>
                            {h(item.icon)}
                        </ElIcon>
                        <span>{t(item.title)}</span>
                        {!!item.href && <ElIcon size={12}><Link /></ElIcon>}
                    </ElMenuItem>
                ))}
            </ElMenu>
        </div>
    )
}, { props: ['onClick'] })

const _default = defineComponent(() => {
    const router = useRouter()
    const title = ref('')
    const [showMenu, , closeMenu, toggleMenu] = useSwitch(false)

    const syncRouter = () => {
        const route = router.currentRoute.value
        route && (title.value = findTitle(route.path))
    }

    watch(router.currentRoute, syncRouter)

    onBeforeMount(() => initTitle(router))

    const clickMenu = (item: MenuItem) => {
        handleClick(item, router)
        closeMenu()
    }

    return () => (
        <Box height='100%' class={showMenu.value ? 'open' : 'close'}>
            <Flex justify='space-between' align='center' height='var(--el-header-height)'>
                <Flex align='center' gap={20}>
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
            {!!showMenu.value && <MenuList onClick={clickMenu} />}
        </Box>
    )
})

export default _default