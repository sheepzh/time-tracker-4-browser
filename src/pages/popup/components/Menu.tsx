import { Aim, Histogram, PieChart } from '@element-plus/icons-vue'
import { localRef } from '@hooks'
import { IconRadioGroup } from '@pages/components'
import { Website } from '@pages/icons'
import { t } from '@popup/locale'
import { createStringUnionGuard } from 'typescript-guard'
import { defineComponent, onBeforeMount, watch } from "vue"
import { useRoute, useRouter } from 'vue-router'

const isMenu = createStringUnionGuard<tt4b.ui.PopupMenu>('site', 'percentage', 'ranking', 'focus')

const useMenu = () => {
    const menu = localRef('popup_menu', isMenu, 'percentage')
    const route = useRoute()
    const router = useRouter()

    onBeforeMount(async () => {
        await router.isReady()
        const initial = route.path.substring(1)
        if (isMenu(initial)) {
            menu.value = initial
        } else {
            // Replace with valid menu
            router.replace(`/${menu.value}`)
        }
    })

    watch(menu, val => router.push(`/${val}`))
    const setMenu = (val: unknown) => isMenu(val) && (menu.value = val)

    return { menu, setMenu }
}

const Menu = defineComponent(() => {
    const { menu, setMenu } = useMenu()

    return () => (
        <IconRadioGroup
            modelValue={menu.value}
            onChange={setMenu}
            options={[
                {
                    value: 'percentage',
                    tooltip: t(msg => msg.footer.route.percentage),
                    icon: PieChart,
                }, {
                    value: 'ranking',
                    tooltip: t(msg => msg.footer.route.ranking),
                    icon: Histogram,
                }, {
                    value: 'site',
                    tooltip: t(msg => msg.footer.route.site),
                    icon: Website,
                }, {
                    value: 'focus',
                    tooltip: t(msg => msg.focus.menu),
                    icon: Aim,
                },
            ]}
        />
    )
})

export default Menu