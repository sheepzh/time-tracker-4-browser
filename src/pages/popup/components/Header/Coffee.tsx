import { locale } from '@i18n'
import { CoffeeIcon } from '@pages/util/icon'
import { BUY_ME_A_COFFEE_PAGE } from '@util/constant/url'
import { ElLink, ElTooltip } from 'element-plus'
import { defineComponent, onMounted, onUnmounted, ref } from 'vue'

const useCoffee = () => {
    const coffeeTip = ref<string>()

    const resetTip = () => {
        const now = new Date()
        const hours = now.getHours()
        let newVal = undefined
        if (hours == 8) {
            newVal = 'Buy me a coffee for a vibrant morning!'
        } else if (hours == 13) {
            newVal = 'Buy me a coffee for a pleasant afternoon!'
        }
        newVal !== coffeeTip.value && (coffeeTip.value = newVal)
    }
    const timer = setInterval(resetTip, 1000)

    onMounted(resetTip)
    onUnmounted(() => clearInterval(timer))

    return coffeeTip
}

const Coffee = defineComponent(() => {
    const tip = useCoffee()
    return () => tip.value && locale !== 'zh_CN' ?
        <ElTooltip
            content={tip.value} offset={3}
            placement='bottom' effect='light'
        >
            <ElLink
                type='info' icon={CoffeeIcon} underline='never'
                href={BUY_ME_A_COFFEE_PAGE} target='_blank'
            />
        </ElTooltip >
        : null
})

export default Coffee