import { MILL_PER_MINUTE } from "@util/time"
import alarmManager from "./alarm-manager"
import optionDatabase from './database/option-database'
import type MessageDispatcher from './message-dispatcher'
import backupProcessor from "./service/backup/processor"
import notificationProcessor from "./service/notification/processor"

const BACKUP_ALARM_NAME = 'auto-backup-data'
const NOTIFICATION_ALARM_NAME = 'notification-data'

export async function initScheduler(dispatcher: MessageDispatcher): Promise<void> {
    dispatcher.register('scheduler.resetBackup', resetBackup)
        .register('scheduler.resetNotification', resetNotification)

    const existBackup = await alarmManager.getAlarm(BACKUP_ALARM_NAME)
    !existBackup && await resetBackup()

    const existNotification = await alarmManager.getAlarm(NOTIFICATION_ALARM_NAME)
    !existNotification && await resetNotification()
}

async function resetBackup(): Promise<void> {
    // MUST read latest option from database
    const option = await optionDatabase.getOption()

    await alarmManager.remove(BACKUP_ALARM_NAME)

    const { autoBackUp, backupType, autoBackUpInterval = 0 } = option
    if (backupType === 'none' || !autoBackUp || !autoBackUpInterval) {
        return
    }

    const interval = autoBackUpInterval * MILL_PER_MINUTE
    await alarmManager.setInterval(BACKUP_ALARM_NAME, interval, async () => {
        const result = await backupProcessor.syncData()
        if (!result.success) {
            console.warn(`Failed to backup ts=${Date.now()}, msg=${result.errorMsg}`)
        }
    })
}

type OffsetHandler = (offsetMin: number) => number
const OFFSET_HANDLERS: Record<Exclude<timer.notification.Cycle, 'none'>, OffsetHandler> = {
    daily: offset => {
        const next = new Date()
        next.setHours(0, offset, 0, 0)
        const now = new Date()
        while (next.getTime() < now.getTime()) {
            next.setDate(next.getDate() + 1)
        }
        return next.getTime()
    },
    weekly: offset => {
        const next = new Date()
        const weekday = next.getDay()
        // Convert JS Sunday-based weekday (Sun=0) to Monday-based (Mon=0)
        const mondayBasedWeekday = (weekday + 6) % 7
        next.setDate(next.getDate() - mondayBasedWeekday)
        next.setHours(0, offset, 0, 0)
        const now = new Date()
        while (next.getTime() < now.getTime()) {
            next.setDate(next.getDate() + 7)
        }
        return next.getTime()
    }
}

async function resetNotification(): Promise<void> {
    await alarmManager.remove(NOTIFICATION_ALARM_NAME)

    const option = await optionDatabase.getOption()
    const { notificationCycle: cycle, notificationOffset: offset } = option

    if (cycle === 'none') return

    await alarmManager.setWhen(
        NOTIFICATION_ALARM_NAME,
        () => OFFSET_HANDLERS[cycle](offset),
        async () => {
            const result = await notificationProcessor.doSend()
            if (!result.success) {
                console.warn(`Failed to send notification ts=${Date.now()}, msg=${result.errorMsg}`)
            }
        }
    )
}