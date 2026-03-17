/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { randomIntBetween } from "@util/number"
import { type VerificationContext, type VerificationGenerator, type VerificationPair } from "../common"

const MIN_START_IDX = 10
const MAX_START_IDX = 25
const MIN_LEN = 5
const MAX_LEN = 15

const DIGIT_PART_PI = '14159265358979323846264338327950288419716939937510'
    + '58209749445923078164062862089986280348253421170679'

/**
 * Generator of pi
 */
class PiGenerator implements VerificationGenerator {
    generate(_: VerificationContext): VerificationPair {
        const startIndex = randomIntBetween(MIN_START_IDX, MAX_START_IDX)
        const digitCount = randomIntBetween(MIN_LEN, MAX_LEN)
        const endIndex = startIndex + digitCount - 1
        const answer = DIGIT_PART_PI.substring(startIndex - 1, endIndex)
        return {
            answer,
            prompt: msg => msg.pi,
            promptParam: {
                startIndex,
                endIndex,
                digitCount,
            },
            second: 20,
        }
    }

    supports(context: VerificationContext): boolean {
        return context.difficulty === 'disgusting'
    }
}

export default PiGenerator