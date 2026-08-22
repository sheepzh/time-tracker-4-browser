import { IS_MV3 } from "@util/constant/environment"
import { handleError } from "./common"
import { getIconUrl } from './runtime'

type Topic = 'time' | 'focus'
type ChromeOptions = chrome.notifications.NotificationCreateOptions
type Options = Omit<ChromeOptions, 'iconUrl'>

/** Play the OS default notification sound (Windows: requires "允许通知播放声音"). */
const AUDIBLE_NOTIFICATION_OPTIONS = {
    silent: false,
    priority: 2,
} as const satisfies Pick<ChromeOptions, 'silent' | 'priority'>

export async function createNotification(topic: Topic, options: Options): Promise<string> {
    const param = { ...AUDIBLE_NOTIFICATION_OPTIONS, ...options, iconUrl: getIconUrl() }
    if (IS_MV3) {
        return await chrome.notifications.create(topic, param)
    } else {
        return new Promise((resolve, reject) => {
            chrome.notifications.create(topic, param, (id: string) => {
                const error = handleError('createNotification')
                if (error) {
                    reject(new Error(error))
                } else {
                    resolve(id)
                }
            })
        })
    }
}

