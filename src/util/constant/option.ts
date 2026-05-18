/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

export const DEFAULT_APPEARANCE: tt4b.option.AppearanceRequired = {
    displayWhitelistMenu: false,
    // Change false to true @since 0.8.4
    displayBadgeText: true,
    locale: "default",
    printInConsole: true,
    darkMode: "default",
    // 6 PM - 6 AM
    // 18*60*60
    darkModeTimeStart: 64800,
    // 6*60*60
    darkModeTimeEnd: 21600,
    // 1s
    chartAnimationDuration: 1000,
} as const

export const DEFAULT_TRACKING: tt4b.option.TrackingRequired = {
    autoPauseTracking: false,
    // 10 minutes
    autoPauseInterval: 600,
    countLocalFiles: false,
    countTabGroup: true,
    weekStart: 'default',
    storage: 'classic',
} as const

export const DEFAULT_LIMIT: tt4b.option.LimitRequired = {
    limitDelayDuration: 5,
    limitLevel: 'nothing',
    limitPassword: '',
    limitVerifyDifficulty: 'easy',
    limitReminder: false,
    limitReminderDuration: 5,
} as const

export const DEFAULT_BACKUP: tt4b.option.BackupOption = {
    backupType: 'none',
    clientName: 'unknown',
    backupAuths: {},
    backupLogin: {},
    backupExts: {},
    autoBackUp: false,
    autoBackUpInterval: 30,
} as const

export const DEFAULT_ACCESSIBILITY: tt4b.option.AccessibilityOption = {
    chartDecal: false
} as const

export const DEFAULT_NOTIFICATION: tt4b.option.NotificationOption = {
    notificationCycle: 'none',
    notificationMethod: 'browser',
    notificationOffset: 0,
} as const

export const defaultOption = () => structuredClone({
    ...DEFAULT_APPEARANCE,
    ...DEFAULT_TRACKING,
    ...DEFAULT_BACKUP,
    ...DEFAULT_LIMIT,
    ...DEFAULT_ACCESSIBILITY,
    ...DEFAULT_NOTIFICATION,
}) satisfies tt4b.option.DefaultOption