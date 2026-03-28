import { IS_MV3 } from '../../util/constant/environment'
import { handleError } from "./common"

type AlarmHandler = (alarm: ChromeAlarm) => PromiseLike<void> | void

export function onAlarm(handler: AlarmHandler) {
    chrome.alarms.onAlarm.addListener(handler)
}

export async function clearAlarm(name: string): Promise<boolean> {
    if (IS_MV3) {
        return chrome.alarms.clear(name)
    } else {
        return new Promise(resolve => chrome.alarms.clear(name, removed => {
            handleError('clearAlarm')
            resolve(removed)
        }))
    }
}

export function createAlarm(name: string, when: number): Promise<void> {
    if (IS_MV3) {
        return chrome.alarms.create(name, { when })
    }
    return new Promise(resolve => chrome.alarms.create(name, { when }, () => {
        handleError('createAlarm')
        resolve()
    }))
}

export async function getAlarm(name: string): Promise<chrome.alarms.Alarm | undefined> {
    if (IS_MV3) {
        return chrome.alarms.get(name)
    }
    return new Promise(resolve => chrome.alarms.get(name, alarm => {
        handleError('getAlarm')
        resolve(alarm)
    }))
}