declare namespace timer {
    type RequiredLocale = 'en'
    type OptionalLocale =
        | 'zh_CN'
        | 'ja'
        // @since 0.9.0
        | 'zh_TW'
        // @since 1.8.2
        | 'pt_PT'
        // @since 2.1.0
        | 'uk'
        // @since 2.1.4
        | 'es'
        // @since 2.2.7
        | 'de'
        // @since 2.3.6
        | 'fr'
        // @since 2.4.6
        | 'ru'
        // @since 2.5.0
        | 'ar'
        // @since 3.7.3
        | 'tr'
        // @since 3.7.3
        | 'pl'
        // @since 4.1.2
        | 'it'

    /**
     * @since 0.8.0
     */
    type Locale = RequiredLocale | OptionalLocale

    /**
     * Translating locales
     *
     * @since 1.4.0
     */
    type TranslatingLocale =
        | 'ko'
        | 'pl'
        | 'it'
        | 'sv'
        | 'fi'
        | 'da'
        | 'hr'
        | 'id'
        | 'cs'
        | 'ro'
        | 'nl'
        | 'vi'
        | 'sk'
        | 'mn'
        | 'hi'

    type ExtensionMeta = {
        installTime?: number
        /**
         * The id of this client
         *
         * @since 1.2.0
         */
        cid?: string
        backup?: {
            [key in timer.backup.Type]?: {
                ts: number
                msg?: string
            }
        }
        notification?: {
            [key in timer.notification.Method]?: {
                ts: number
                endDate: string
                msg?: string
            }
        }
        /**
         * Two-factor auth
         */
        twoFa?: timer.TwoFactorAuth
    }

    type TwoFactorAuth = {
        secret: string
        iv: string
        salt: string
    }
}