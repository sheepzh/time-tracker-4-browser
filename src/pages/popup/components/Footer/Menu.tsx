import { Histogram, PieChart, Timer } from '@element-plus/icons-vue'
import { useMenu } from '@popup/context'
import { t } from '@popup/locale'
import type { PopupMenu } from '@popup/types'
import { ElIcon, ElRadioButton, ElRadioGroup, ElTooltip } from "element-plus"
import { type Component, defineComponent, h } from "vue"

type MenuItem = {
    icon: Component
    route: PopupMenu
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
    }
] as const

const Menu = defineComponent(() => {
    const { menu, setMenu } = useMenu()

    return () => (
        <ElRadioGroup modelValue={menu.value} onChange={v => setMenu(v as PopupMenu)}>
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