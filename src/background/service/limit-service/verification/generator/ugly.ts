/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { range } from "@util/array"
import { randomIntBetween } from "@util/number"
import type { VerificationContext, VerificationGenerator, VerificationPair } from "../common"

const BASE = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz\`-=[]/.,:\"<>?!@#$%^&*()_+;'".replaceAll(/[01IlLOo]/g, "")
const BASE_LEN = BASE.length

class UglyGenerator implements VerificationGenerator {
    supports(context: VerificationContext): boolean {
        const { difficulty } = context
        return difficulty === 'hard' || difficulty === 'disgusting'
    }

    generate(context: VerificationContext): VerificationPair {
        const { difficulty } = context
        const len = difficulty === 'hard' ? randomIntBetween(8, 12) : randomIntBetween(16, 20)
        const answer = range(len)
            .map(() => randomIntBetween(0, BASE_LEN))
            .map(decimal => BASE.charAt(decimal))
            .join('')

        return { answer, second: 20 }
    }
}

export default UglyGenerator