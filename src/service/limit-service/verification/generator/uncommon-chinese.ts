/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { randomIntBetween } from "@util/number"
import type { VerificationContext, VerificationGenerator, VerificationPair } from "../common"

const UNCOMMON_WORDS = '龘靐齉齾爩鱻麤龗灪吁龖厵滟爨癵籱饢驫鲡鹂鸾麣纞虋讟钃骊郁鸜麷鞻韽韾响顟顠饙饙騳騱饐'
const LENGTH = UNCOMMON_WORDS.length

class UncommonChinese implements VerificationGenerator {
    supports({ difficulty, locale }: VerificationContext): boolean {
        return difficulty === 'disgusting' && (locale === 'zh_CN' || locale === 'zh_TW')
    }

    generate(_: VerificationContext): VerificationPair {
        let answer = ''
        while (answer.length < 3) {
            const idx = randomIntBetween(0, LENGTH)
            const ch = UNCOMMON_WORDS[idx]
            if (!answer.includes(ch)) {
                answer += ch
            }
        }
        return { answer, second: 15 }
    }
}

export default UncommonChinese