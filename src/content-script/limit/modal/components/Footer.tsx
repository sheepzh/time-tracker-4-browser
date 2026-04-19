import { APP_ANALYSIS_ROUTE, APP_LIMIT_ROUTE, AppLimitQuery, type AppAnalysisQuery } from '@/shared/route'
import { trySendMsg2Runtime } from '@api/sw/common'
import { processVerification } from '@app/util/limit'
import { t } from "@cs/locale"
import { Plus, Timer } from "@element-plus/icons-vue"
import Flex from '@pages/components/Flex'
import Trend from "@pages/icons/Trend"
import { getAppPageUrl } from '@util/constant/url'
import { meetTimeLimit } from '@util/limit'
import { MILL_PER_SECOND } from '@util/time'
import { ElButton } from "element-plus"
import { computed, defineComponent } from "vue"
import { useApp, useRule } from '../context'

const _default = defineComponent(() => {
    const { reason, visitTime: currVisitTime, bridge, url, delayDuration } = useApp()

    const analysisUrl = getAppPageUrl(APP_ANALYSIS_ROUTE, { url } satisfies AppAnalysisQuery)
    const ruleUrl = getAppPageUrl(APP_LIMIT_ROUTE, { url: encodeURI(url) } satisfies AppLimitQuery)

    const rule = useRule()
    const showDelay = computed(() => {
        const reasonVal = reason.value
        if (!reasonVal) return false
        const { type, allowDelay, delayCount = 0 } = reasonVal
        if (!allowDelay) return false

        const { time, weekly, visitTime, waste, weeklyWaste } = rule.value ?? {}
        let maxLimitMs = 0, wasted = 0
        if (type === 'DAILY') {
            maxLimitMs = (time ?? 0) * MILL_PER_SECOND
            wasted = waste ?? 0
        } else if (type === 'WEEKLY') {
            maxLimitMs = (weekly ?? 0) * MILL_PER_SECOND
            wasted = weeklyWaste ?? 0
        } else if (type === 'VISIT') {
            maxLimitMs = (visitTime ?? 0) * MILL_PER_SECOND
            wasted = currVisitTime.value
        } else {
            return false
        }
        return meetTimeLimit(
            { wasted, maxLimit: maxLimitMs },
            { count: delayCount, duration: delayDuration.value, allow: !!allowDelay },
        )
    })

    const handleDelay = async () => {
        const option = await trySendMsg2Runtime('option.get')
        try {
            if (option) await processVerification(option)
            await bridge.request('delay', undefined)
        } catch {
        }
    }

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
                round icon={Plus} onClick={handleDelay}
            >
                {t(msg => msg.modal.delay, { n: delayDuration.value })}
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