import { IS_MV3 } from "@util/constant/environment"
import { handleError } from "./common"
import { getIconUrl } from './runtime'

type Topic = 'time'
type ChromeOptions = chrome.notifications.NotificationCreateOptions
type Options = Omit<ChromeOptions, 'iconUrl'>

export async function createNotification(topic: Topic, options: Options): Promise<string> {
    const param = { ...options, iconUrl: getIconUrl() }
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

