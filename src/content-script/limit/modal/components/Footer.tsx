import { APP_ANALYSIS_ROUTE, APP_LIMIT_ROUTE, AppLimitQuery, type AppAnalysisQuery } from '@/shared/route'
import { getAppPageUrl } from '@/util/constant/url'
import { trySendMsg2Runtime } from '@api/sw/common'
import { judgeVerificationRequired, processVerification } from '@app/util/limit/index'
import { TAG_NAME } from "@cs/limit/element"
import { t } from "@cs/locale"
import { Plus, Timer } from "@element-plus/icons-vue"
import Flex from '@pages/components/Flex'
import Trend from "@pages/icons/Trend"
import { meetTimeLimit } from '@util/limit'
import { ElButton } from "element-plus"
import { computed, defineComponent } from "vue"
import { useApp, useRule } from '../context'

async function handleMore5Minutes(rule: timer.limit.Item | undefined, callback: () => void) {
    let promise: Promise<void> | undefined = undefined
    const ele = document.querySelector(TAG_NAME)?.shadowRoot?.querySelector('body')
    if (rule && await judgeVerificationRequired(rule)) {
        const option = await trySendMsg2Runtime('option.get')
        if (!option) return callback()
        promise = processVerification(option, { appendTo: ele ?? undefined })
        promise ? promise.then(callback).catch(() => { }) : callback()
    } else {
        callback()
    }
}

const _default = defineComponent(() => {
    const { reason, visitTime: currVisitTime, bridge, url } = useApp()

    const analysisUrl = getAppPageUrl(APP_ANALYSIS_ROUTE, { url } satisfies AppAnalysisQuery)
    const ruleUrl = getAppPageUrl(APP_LIMIT_ROUTE, { url: encodeURI(url) } satisfies AppLimitQuery)

    const rule = useRule()
    const showDelay = computed(() => {
        const { type, allowDelay, delayCount = 0 } = reason.value ?? {}
        if (!allowDelay) return false

        const { time, weekly, visitTime, waste, weeklyWaste } = rule.value ?? {}
        let realLimit = 0, realWaste = 0
        if (type === 'DAILY') {
            realLimit = time ?? 0
            realWaste = waste ?? 0
        } else if (type === 'WEEKLY') {
            realLimit = weekly ?? 0
            realWaste = weeklyWaste ?? 0
        } else if (type === 'VISIT') {
            realLimit = visitTime ?? 0
            realWaste = currVisitTime.value
        } else {
            return false
        }
        return meetTimeLimit(realLimit, realWaste, allowDelay, delayCount)
    })

    return () => (
        <Flex gap={10} marginBottom={60} justify='center'>
            <a target='_blank' href={analysisUrl}>
                <ElButton round icon={Trend} type="success">
                    {t(msg => msg.menu.siteAnalysis)}
                </ElButton>
            </a>
            <ElButton
                v-show={showDelay.value}
                type="primary"
                round
                icon={Plus}
                onClick={() => handleMore5Minutes(rule.value, () => bridge.request('delay', undefined))}
            >
                {t(msg => msg.modal.more5Minutes)}
            </ElButton>
            <a target='_blank' href={ruleUrl}>
                <ElButton round icon={Timer}>
                    {t(msg => msg.modal.ruleDetail)}
                </ElButton>
            </a>
        </Flex>
    )
})

export default _default