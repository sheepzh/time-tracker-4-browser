/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { type I18nKey } from "@i18n"
import { type LimitMessage } from "@i18n/message/app/limit"

type LimitVerificationMessage = LimitMessage['verification']

export type VerificationContext = {
    difficulty: timer.limit.VerificationDifficulty
    locale: timer.Locale
}

export type VerificationPair = {
    prompt?: I18nKey<LimitVerificationMessage> | string
    promptParam?: any
    answer: I18nKey<LimitVerificationMessage> | string
    second: number
}

/**
 * Verification code generator
 */
export interface VerificationGenerator {
    /**
     * Whether to support
     */
    supports(context: VerificationContext): boolean

    /**
     * Render the prompt
     */
    generate(context: VerificationContext): VerificationPair
}