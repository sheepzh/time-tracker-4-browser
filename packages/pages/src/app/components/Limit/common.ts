import { getOption } from "@api/sw/option"
import { judgeVerificationRequired, processVerification } from "@app/util/limit"

const batchJudge = async (items: timer.limit.Item[]): Promise<boolean> => {
    if (!items?.length) return false
    for (const item of items) {
        if (!item) continue
        const needVerify = await judgeVerificationRequired(item)
        if (needVerify) return true
    }
    return false
}

export const verifyCanModify = async (...items: timer.limit.Item[]) => {
    const needVerify = await batchJudge(items)
    console.log('needVerify', needVerify)
    if (!needVerify) return

    // Open delay for limited rules, so verification is required
    const option = await getOption()
    if (!option) return
    await processVerification(option)
}