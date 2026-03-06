import { judgeVerificationRequired, processVerification } from "@app/util/limit"
import limitService from "@service/limit-service"
import { ref } from "vue"

export const useVerify = (option: timer.option.LimitOption) => {
    const verified = ref(false)

    const verify = async (): Promise<void> => {
        if (verified.value) return
        const items = await limitService.select()
        const triggerResults = await Promise.all((items || []).map(judgeVerificationRequired))
        const anyTrigger = triggerResults.some(t => !!t)
        if (anyTrigger) {
            await processVerification(option)
        }
        verified.value = true
    }

    return { verified, verify }
}