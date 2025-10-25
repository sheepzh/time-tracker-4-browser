/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

type AppearanceRequired = MakeRequired<timer.option.AppearanceOption, 'darkModeTimeStart' | 'darkModeTimeEnd'>

export function defaultAppearance(): AppearanceRequired {
    return {
        displayWhitelistMenu: true,
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
    }
}

type StatisticsRequired = MakeRequired<timer.option.StatisticsOption, 'weekStart'>

export function defaultStatistics(): StatisticsRequired {
    return {
        autoPauseTracking: false,
        // 10 minutes
        autoPauseInterval: 600,
        countLocalFiles: true,
        countTabGroup: false,
        weekStart: 'default',
    }
}

type DailyLimitRequired = MakeRequired<timer.option.LimitOption, 'limitPassword' | 'limitVerifyDifficulty' | 'limitReminderDuration'>

export function defaultDailyLimit(): DailyLimitRequired {
    return {
        limitLevel: 'nothing',
        limitPassword: '',
        limitVerifyDifficulty: 'easy',
        limitReminder: false,
        limitReminderDuration: 5,
    }
}

export function defaultBackup(): timer.option.BackupOption {
    return {
        backupType: 'none',
        clientName: 'unknown',
        backupAuths: {},
        backupLogin: {},
        backupExts: {},
        autoBackUp: false,
        autoBackUpInterval: 30,
    }
}

export function defaultAccessibility(): timer.option.AccessibilityOption {
    return {
        chartDecal: false,
    }
}

export type DefaultOption =
    & AppearanceRequired & StatisticsRequired & DailyLimitRequired
    & timer.option.BackupOption & timer.option.AccessibilityOption

export function defaultOption(): DefaultOption {
    return {
        ...defaultAppearance(),
        ...defaultStatistics(),
        ...defaultBackup(),
        ...defaultDailyLimit(),
        ...defaultAccessibility(),
    }
}