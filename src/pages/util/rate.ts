import { trySendMsg2Runtime } from '@api/sw/common'
import { REVIEW_PAGE } from '@util/constant/url'
import { getDayLength } from '@util/time'

const INSTALL_DAY_MIN_LIMIT = 14

const FLAG = 'rateOpen'

export async function recommendRate(): Promise<boolean> {
    if (!REVIEW_PAGE) return false
    const installTime = await trySendMsg2Runtime('meta.installTs')
    if (!installTime) return false
    const installedDays = getDayLength(new Date(installTime), new Date())
    if (installedDays < INSTALL_DAY_MIN_LIMIT) return false
    return !localStorage.getItem(FLAG)
}

export function rateClicked() {
    localStorage.setItem(FLAG, '1')
}