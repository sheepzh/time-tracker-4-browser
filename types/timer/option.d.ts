/**
 * The options
 *
 * @since 0.3.0
 */
declare namespace timer.option {
    type PopupDuration =
        | "today" | "yesterday" | "thisWeek" | "thisMonth"
        | "lastDays"
        | "allTime"
    /**
     * Options used for the popup page
     */
    type PopupOption = {
        /**
         * The max count of today's data to display on popup page
         */
        popupMax: number
        /**
         * Replace the host name with site name which is detected automatically from the title of site homepages,
         * or modified manually by the user
         *
         * @since 0.5.0
         */
        displaySiteName: boolean
        /**
         * Merge method
         *
         * @since 3.0.0
         */
        defaultMergeMethod?: timer.stat.MergeMethod
    }

    /**
     * @since 1.2.5
     */
    type WeekStartOption =
        | 'default'
        | number  // Weekday, From 1 to 7

    type DarkMode =
        // Follow the OS, @since 1.3.3
        | "default"
        // Always on
        | "on"
        // Always off
        | "off"
        // Timed on
        | "timed"

    type AppearanceOption = {
        /**
         * Whether to display the whitelist button in the context menu
         *
         * @since 0.3.2
         */
        displayWhitelistMenu: boolean
        /**
         * Whether to display the badge text of focus time
         *
         * @since 0.3.3
         */
        displayBadgeText: boolean
        /**
         * The background color of badge text
         *
         * @since 2.3.0
         */
        badgeBgColor?: string
        /**
         * The language of this extension
         *
         * @since 0.8.0
         */
        locale: LocaleOption
        /**
         * Whether to print the info in the console
         *
         * @since 0.8.6
         */
        printInConsole: boolean
        /**
         * The state of dark mode
         *
         * @since 1.1.0
         */
        darkMode: DarkMode
        /**
         * The range of seconds to turn on dark mode. Required if {@param darkMode} is 'timed'
         *
         * @since 1.1.0
         */
        darkModeTimeStart?: number
        darkModeTimeEnd?: number
        /**
        * The animation of charts
        *
        * @since 3.2.2
        */
        chartAnimationDuration: number
    }

    type StatisticsOption = {
        /**
         * Whether to pause tracking if no activity detected
         *
         * @since 2.5.4
         */
        autoPauseTracking: boolean
        /**
         * Check interval of auto pausing, seconds
         *
         * @since 2.5.4
         */
        autoPauseInterval: number
        /**
         * Whether to count the local files
         * @since 0.7.0
         */
        countLocalFiles: boolean
        /**
         * Whether to count the tile of tab group
         */
        countTabGroup: boolean
        /**
         * The start of one week
         * @since 2.4.1
         */
        weekStart?: WeekStartOption
    }

    type LimitOption = {
        /**
         * Motto displayed when restricted
         */
        limitPrompt?: string
        /**
         *  the duration of delay
         */
        delayDuration: number
        /**
         * restriction level
         */
        limitLevel: limit.RestrictionLevel
        /**
         * The password to unlock
         */
        limitPassword?: string
        /**
         * The difficulty of verification
         */
        limitVerifyDifficulty?: limit.VerificationDifficulty
        /**
         *  Whether to reminder before time will meet
         *
         * @since 3.1.0
         */
        limitReminder: boolean
        /**
         * Minutes
         *
         * @since 3.1.0
         */
        limitReminderDuration?: number
    }

    /**
     * The options of backup
     *
     * @since 1.2.0
     */
    type BackupOption = {
        /**
         * The type 2 backup
         */
        backupType: backup.Type
        /**
         * The auth of types, maybe ak/sk or static token
         */
        backupAuths: { [type in backup.Type]?: string }
        /**
         * Login info of types
         */
        backupLogin: { [type in backup.Type]?: backup.LoginInfo }
        /**
         * The extended information of types, including url, file path, and so on
         */
        backupExts?: {
            [type in backup.Type]?: backup.TypeExt
        }
        /**
         * The name of this client
         */
        clientName: string
        /**
         * Whether to auto-backup data
         */
        autoBackUp: boolean
        /**
         * Interval to auto-backup data, minutes
         */
        autoBackUpInterval: number
    }

    type AccessibilityOption = {
        /**
         * Show decals for charts
         */
        chartDecal: boolean
    }

    type AllOption = PopupOption
        & AppearanceOption
        & StatisticsOption
        & LimitOption
        & AccessibilityOption
        & BackupOption
    /**
     * @since 0.8.0
     */
    type LocaleOption = Locale | "default"
}
