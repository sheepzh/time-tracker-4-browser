declare namespace timer.limit {
    /**
    * Restricted periods
    * [0, 1] means from 00:00 to 00:01
    * [0, 120] means from 00:00 to 02:00
    * @since 2.0.0
    */
    type Period = Vector<2>
    /**
     * Limit rule in runtime
     *
     * @since 0.8.4
     */
    type Item = Rule & {
        /**
         * Waste today, milliseconds
         */
        waste: number
        /**
         * Visit count today
         *
         * @since 3.1.0
         */
        visit: number
        /**
         * Number of delays today
         */
        delayCount: number
        /**
         * Waste this week, milliseconds
         */
        weeklyWaste: number
        /**
         * Visit count this week
         *
         * @since 3.1.0
         */
        weeklyVisit: number
        /**
         * Delay count of this week
         */
        weeklyDelayCount: number
    }
    type Rule = {
        /**
         * Id
         */
        id: number
        /**
         * Name
         */
        name: string
        /**
         * Condition, can be regular expression with star signs
         */
        cond: string[]
        /**
         * Time limit per day, seconds
         */
        time?: number
        /**
         * Visit count per day
         *
         * @since 3.1.0
         */
        count?: number
        /**
         * Time limit per week, seconds
         *
         * @since 2.4.1
         */
        weekly?: number
        /**
         * Visit count per week
         *
         * @since 3.1.0
         */
        weeklyCount?: number
        /**
         * Time limit per visit, seconds
         *
         * @since 2.0.0
         */
        visitTime?: number
        enabled: boolean
        /**
         * Locked
         *
         * @since 3.4.0
         */
        locked: boolean
        /**
         * @since 2.3.4
         */
        weekdays?: number[]
        /**
         * Allow to delay 5 minutes if time over
         */
        allowDelay: boolean
        periods?: Period[]
    }
    /**
     * @since 1.9.0
     */
    type RestrictionLevel =
        // No additional action required to lock
        | 'nothing'
        // Password required to lock or modify restricted rule
        | 'password'
        // Verification code input required to lock or modify restricted rule
        | 'verification'
        // Not allowed to unlock manually
        | 'strict'
    /**
     * @since 1.9.0
     */
    type VerificationDifficulty =
        // Easy
        | 'easy'
        // Need some operations
        | 'hard'
        // Disgusting
        | 'disgusting'

    type ReasonType =
        | "DAILY"
        | "WEEKLY"
        | "VISIT"
        | "PERIOD"

    /**
     * @since 3.1.0
     */
    type ReminderInfo = {
        items: timer.limit.Item[]
        // Minutes
        duration: number
    }

    type Query = {
        id?: number
        url?: string
        // Only enabled rules
        enabled?: boolean
        // Only effective rules (should be enabled and meet effective conditions)
        effective?: boolean
        // Only effective and limited rules
        limited?: boolean
    }

    type Summary = {
        url: string
        site: site.SiteInfo
        items: timer.limit.Item[]
    }
}
