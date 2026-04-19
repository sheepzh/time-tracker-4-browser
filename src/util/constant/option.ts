/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

type AppearanceRequired = MakeRequired<timer.option.AppearanceOption, 'darkModeTimeStart' | 'darkModeTimeEnd'>

export const DEFAULT_APPEARANCE = {
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
} as const satisfies AppearanceRequired

type TrackingRequired = MakeRequired<timer.option.TrackingOption, 'weekStart'>

export const DEFAULT_TRACKING = {
    autoPauseTracking: false,
    // 10 minutes
    autoPauseInterval: 600,
    countLocalFiles: false,
    countTabGroup: false,
    weekStart: 'default',
    storage: 'classic',
} as const satisfies TrackingRequired

type LimitRequired = MakeRequired<timer.option.LimitOption, 'limitPassword' | 'limitVerifyDifficulty' | 'limitReminderDuration'>

export const DEFAULT_LIMIT = {
    limitDelayDuration: 5,
    limitLevel: 'nothing',
    limitPassword: '',
    limitVerifyDifficulty: 'easy',
    limitReminder: false,
    limitReminderDuration: 5,
} as const satisfies LimitRequired

export const DEFAULT_BACKUP = {
    backupType: 'none',
    clientName: 'unknown',
    backupAuths: {},
    backupLogin: {},
    backupExts: {},
    autoBackUp: false,
    autoBackUpInterval: 30,
} as const satisfies timer.option.BackupOption

export const DEFAULT_ACCESSIBILITY = {
    chartDecal: false
} as const as timer.option.AccessibilityOption

export const DEFAULT_NOTIFICATION = {
    notificationCycle: 'none',
    notificationMethod: 'browser',
    notificationOffset: 0,
} as const satisfies timer.option.NotificationOption

export type DefaultOption =
    & AppearanceRequired & TrackingRequired & LimitRequired
    & timer.option.BackupOption & timer.option.AccessibilityOption
    & timer.option.NotificationOption

export const defaultOption = () => structuredClone({
    ...DEFAULT_APPEARANCE,
    ...DEFAULT_TRACKING,
    ...DEFAULT_BACKUP,
    ...DEFAULT_LIMIT,
    ...DEFAULT_ACCESSIBILITY,
    ...DEFAULT_NOTIFICATION,
}) satisfies DefaultOption