/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { type VerificationContext, type VerificationGenerator, type VerificationPair } from "../common"

/**
 * Generator of confession
 */
class ConfessionGenerator implements VerificationGenerator {
    supports(context: VerificationContext): boolean {
        return context.difficulty === 'easy'
    }
    generate(_: VerificationContext): VerificationPair {
        return {
            answer: msg => msg.confession,
            second: 20,
        }
    }
}

export default ConfessionGenerator