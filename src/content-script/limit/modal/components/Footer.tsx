import { sendMsg2Runtime } from "@api/chrome/runtime"
import Trend from "@app/Layout/icons/Trend"
import { judgeVerificationRequired, processVerification } from "@app/util/limit"
import { TAG_NAME } from "@cs/limit/element"
import { t } from "@cs/locale"
import { Plus, Timer } from "@element-plus/icons-vue"
import { useRequest } from '@hooks/useRequest'
import optionHolder from "@service/components/option-holder"
import { defaultDailyLimit } from '@util/constant/option'
import { meetTimeLimit } from '@util/limit'
import { ElButton } from "element-plus"
import { computed, defineComponent } from "vue"
import { useDelayHandler, useReason, useRule } from "../context"

const useDelay = () => {
    const delayHandler = useDelayHandler()
    const { data: delayDuration } = useRequest(
        () => optionHolder.get().then(o => o.delayDuration),
        { defaultValue: defaultDailyLimit().delayDuration },
    )
    async function handleDelay(rule: timer.limit.Item | null) {
        let promise: Promise<void> | undefined = undefined
        const ele = document.querySelector(TAG_NAME)?.shadowRoot?.querySelector('body')
        const callback = () => delayHandler(delayDuration.value)

        if (rule && await judgeVerificationRequired(rule)) {
            const option = await optionHolder.get()
            promise = processVerification(option, { appendTo: ele ?? undefined })
            promise ? promise.then(callback).catch(() => { }) : callback()
        } else {
            callback()
        }
    }

    return { handleDelay, delayDuration }
}

const _default = defineComponent(() => {
    const reason = useReason()
    const rule = useRule()
    const showDelay = computed(() => {
        const { type, allowDelay, delayCount = 0 } = reason.value || {}
        if (!allowDelay) return false

        const { time, weekly, visitTime, waste, weeklyWaste } = rule.value || {}
        let realLimit = 0, realWaste = 0
        if (type === 'DAILY') {
            realLimit = time ?? 0
            realWaste = waste ?? 0
        } else if (type === 'WEEKLY') {
            realLimit = weekly ?? 0
            realWaste = weeklyWaste ?? 0
        } else if (type === 'VISIT') {
            realLimit = visitTime ?? 0
            realWaste = reason.value?.getVisitTime?.() ?? 0
        } else {
            return false
        }
        return meetTimeLimit(realLimit, realWaste, allowDelay, delayCount)
    })

    const { handleDelay, delayDuration } = useDelay()

    return () => (
        <div class='footer-container'>
            <ElButton
                round
                icon={Trend}
                type="success"
                onClick={() => sendMsg2Runtime('cs.openAnalysis')}
            >
                {t(msg => msg.menu.siteAnalysis)}
            </ElButton>
            <ElButton
                v-show={showDelay.value}
                type="primary"
                round icon={Plus}
                onClick={() => handleDelay(rule.value)}
            >
                {t(msg => msg.modal.delayButton, { n: delayDuration.value })}
            </ElButton>
            <ElButton
                round
                icon={Timer}
                onClick={() => sendMsg2Runtime('cs.openLimit')}
            >
                {t(msg => msg.modal.ruleDetail)}
            </ElButton>
        </div>
    )
})

export default _default