/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { getVersion } from '@api/chrome/runtime'
import { t } from "@app/locale"
import { Expand, Fold } from '@element-plus/icons-vue'
import { css } from '@emotion/css'
import { useCached } from '@hooks/useCached'
import { useState } from '@hooks/useState'
import Flex from '@pages/components/Flex'
import { colorVariant } from '@pages/util/style'
import { ElCollapseTransition, ElIcon, ElMenu, ElMenuItem, ElMenuItemGroup, ElScrollbar, ElText, ElTooltip, useNamespace } from "element-plus"
import { defineComponent, h, nextTick, onMounted, type Ref, ref, type StyleValue, watch } from "vue"
import { type Router, useRouter } from "vue-router"
import { MENU_GROUPS, type MenuItem } from "./item"
import { handleClick, initTitle } from "./route"
import { colorMenu } from './style'

const useCollapseState = () => {
    const { data: collapsed } = useCached('menu-collapsed', false)
    const [tooltipVisible, setTooltipVisible] = useState(false)

    const toggle = () => {
        setTooltipVisible(false)
        nextTick(() => collapsed.value = !collapsed.value)
    }

    return {
        collapsed, toggle,
        tooltipVisible, setTooltipVisible,
    }
}

const useStyle = () => {
    const menuNs = useNamespace('menu')
    const iconNs = useNamespace('icon')

    return css`
        & .${menuNs.b()}:not(.${menuNs.m('collapse')}) {
            width: 240px;
        }
        & .${menuNs.b('item')} .${iconNs.b()} {
            height: 1em;
            line-height: 0.83em;
        }
        & .${menuNs.b('item')}.is-active {
            background: var(${colorVariant('primary')})
        }
        & .${menuNs.b()}:not(.${menuNs.m('collapse')}) .${menuNs.b('item')} .${iconNs.b()} {
            padding-inline: 4px;
        }
    `
}

const renderItem = (item: MenuItem, router: Router, curr: Ref<string | undefined>) => (
    <ElMenuItem
        index={item.index ?? item.route ?? item.href}
        onClick={() => handleClick(item, router, curr)}
        v-slots={{
            default: () => <ElIcon size={18}>{h(item.icon)}</ElIcon>,
            title: () => <span>{t(item.title)}</span>,
        }}
    />
)

const _default = defineComponent(() => {
    const router = useRouter()
    const curr = ref<string>()
    const syncRouter = () => {
        const route = router.currentRoute.value
        route && (curr.value = route.path)
    }
    watch(router.currentRoute, syncRouter)

    onMounted(() => initTitle(router))

    const {
        collapsed, toggle,
        tooltipVisible, setTooltipVisible,
    } = useCollapseState()
    const cls = useStyle()

    return () => (
        <Flex
            class={cls}
            column height='100vh'
            color='text-primary' bgColor={`var(${colorMenu('bg')})`}
        >
            <ElScrollbar style={{ flex: 1 }}>
                <ElMenu
                    collapse={collapsed.value}
                    defaultActive={curr.value}
                    style={{
                        border: 'none',
                        paddingBlock: '10px',
                        width: collapsed.value ? undefined : '240px',
                    } satisfies StyleValue}
                >
                    {collapsed.value
                        ? MENU_GROUPS.flatMap(g => g.children).map(item => renderItem(item, router, curr))
                        : MENU_GROUPS.map(({ children, title }) => (
                            <ElMenuItemGroup title={t(title)}>
                                {children.map(item => renderItem(item, router, curr))}
                            </ElMenuItemGroup>
                        ))}
                </ElMenu>
            </ElScrollbar>
            <Flex
                height={48} gap={5} align='center'
                justify={collapsed.value ? 'center' : undefined}
                paddingInline={collapsed.value ? undefined : 24}
            >
                <ElTooltip
                    visible={tooltipVisible.value}
                    onUpdate:visible={setTooltipVisible}
                    effect='dark' placement='right'
                    transition='el-fade-in-linear'
                    offset={collapsed.value ? 32 : undefined}
                    content={t(msg => msg.button[collapsed.value ? 'expand' : 'collapse'])}
                >
                    <Flex onClick={toggle} cursor='pointer' paddingInline={4}>
                        <ElIcon size={18} color={`var(${colorMenu('text')})`}>
                            {collapsed.value ? <Expand /> : <Fold />}
                        </ElIcon>
                    </Flex>
                </ElTooltip>
                <ElCollapseTransition>
                    <ElText v-show={!collapsed.value} type='info' size='small'>
                        v{getVersion()}
                    </ElText>
                </ElCollapseTransition>
            </Flex>
        </Flex >
    )
})

export default _default