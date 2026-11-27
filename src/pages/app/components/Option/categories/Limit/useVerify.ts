import { StatDay } from '@/shared/day'
import { listLimits } from "@api/sw/limit"
import { getOption } from '@api/sw/option'
import { judgeVerificationRequired, processVerification } from "@pages/util/limit"
import { ref } from "vue"

/**
 * @param pswRequired must verify password even not triggered yet
 */
export const useVerify = (option: tt4b.option.LimitOption, pswRequired?: boolean) => {
    const verified = ref(false)

    const verify = async (): Promise<void> => {
        if (verified.value) return
        const items = await listLimits({ enabled: true, effective: true })
        const delayDuration = option.limitDelayDuration
        const { dayStart } = await getOption()
        const today = StatDay.today(dayStart)
        const triggerResults = await Promise.all(items.map(item => judgeVerificationRequired(item, delayDuration, today)))
        const anyTrigger = triggerResults.some(t => t)
        // Need to verify password at the first time
        const verifyPsw = pswRequired && option.limitLevel === 'password'
        if (anyTrigger || verifyPsw) await processVerification(option)
        verified.value = true
    }

    return { verified, verify }
}