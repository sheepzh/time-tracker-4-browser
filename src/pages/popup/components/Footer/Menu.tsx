import { Aim, Histogram, PieChart, Timer } from '@element-plus/icons-vue'
import { useMenu } from '@popup/context'
import { t } from '@popup/locale'
import { ElIcon, ElRadioButton, ElRadioGroup, ElTooltip } from "element-plus"
import { createStringUnionGuard } from 'typescript-guard'
import { type Component, defineComponent, h } from "vue"

type MenuItem = {
    icon: Component
    route: tt4b.ui.PopupMenu
    label: string
}

const createItems = (): MenuItem[] => [
    {
        route: 'percentage',
        label: t(msg => msg.footer.route.percentage),
        icon: PieChart,
    }, {
        route: 'ranking',
        label: t(msg => msg.footer.route.ranking),
        icon: Histogram,
    }, {
        route: 'limit',
        label: t(msg => msg.base.limit),
        icon: Timer,
    }, {
        route: 'focus',
        label: t(msg => msg.shared.focus.menu),
        icon: Aim,
    },
]

export const isMenu = createStringUnionGuard<tt4b.ui.PopupMenu>('limit', 'percentage', 'ranking', 'focus')

const Menu = defineComponent(() => {
    const { menu, setMenu } = useMenu()

    return () => (
        <ElRadioGroup modelValue={menu.value} onChange={v => isMenu(v) && setMenu(v)}>
            {createItems().map(({ route, label, icon }) => (
                <ElRadioButton value={route}>
                    <ElTooltip content={label}>
                        <ElIcon>{h(icon)}</ElIcon>
                    </ElTooltip>
                </ElRadioButton>
            ))}
        </ElRadioGroup>
    )
})

export default Menu