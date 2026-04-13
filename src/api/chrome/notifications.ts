import { IS_MV3 } from "@util/constant/environment"
import { handleError } from "./common"

type NotificationTopic = 'time'

export async function createNotification(
    topic: NotificationTopic,
    options: MakeRequired<chrome.notifications.NotificationOptions, 'type' | 'title' | 'message' | 'iconUrl'>
): Promise<string> {
    if (IS_MV3) {
        return await chrome.notifications.create(topic, options)
    } else {
        return new Promise((resolve, reject) => {
            chrome.notifications.create(topic, options, (id: string) => {
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

