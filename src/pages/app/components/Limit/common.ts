import { getOption } from "@api/sw/option"
import { judgeVerificationRequired, processVerification } from "@app/util/limit/index"

const batchJudge = async (items: timer.limit.Item[]): Promise<boolean> => {
    if (!items?.length) return false
    const { limitDelayDuration } = await getOption()
    for (const item of items) {
        if (!item) continue
        const needVerify = await judgeVerificationRequired(item, limitDelayDuration)
        if (needVerify) return true
    }
    return false
}

export const verifyCanModify = async (...items: timer.limit.Item[]) => {
    const needVerify = await batchJudge(items)
    if (!needVerify) return

    // Open delay for limited rules, so verification is required
    const option = await getOption()
    if (!option) return
    await processVerification(option)
}

export function cleanCond(origin: string): string
export function cleanCond(origin: undefined): undefined
export function cleanCond(origin: string | undefined): string | undefined {
    if (!origin) return undefined

    const startIdx = origin?.indexOf('//')
    const endIdx = origin?.indexOf('?')
    let res = origin.substring(startIdx === -1 ? 0 : startIdx + 2, endIdx === -1 ? undefined : endIdx)
    while (res.endsWith('/')) {
        res = res.substring(0, res.length - 1)
    }
    return res || undefined
}