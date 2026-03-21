import { t } from "@popup/locale"
import { POPUP_ROUTES } from "@popup/router"
import { ElRadioButton, ElRadioGroup } from "element-plus"
import { computed, defineComponent } from "vue"
import { useRoute, useRouter } from "vue-router"

const Menu = defineComponent(() => {
    const route = useRoute()

    const current = computed(() => route.path?.substring?.(1))

    const router = useRouter()
    return () => (
        <ElRadioGroup
            modelValue={current.value}
            onChange={val => router.push('/' + val)}
        >
            {POPUP_ROUTES.map(route => (
                <ElRadioButton value={route}>
                    {t(msg => msg.footer.route[route])}
                </ElRadioButton>
            ))}
        </ElRadioGroup>
    )
})

export default Menu