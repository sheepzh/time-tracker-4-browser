/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { randomIntBetween } from "@util/number"
import { ALL_GENERATORS } from "./generator"
import type { VerificationContext, VerificationGenerator, VerificationPair } from "./types"

class VerificationProcessor {
    generators: VerificationGenerator[]

    constructor() {
        this.generators = ALL_GENERATORS
    }

    generate(difficulty: timer.limit.VerificationDifficulty, locale: timer.Locale): VerificationPair | undefined {
        const context: VerificationContext = { difficulty, locale }
        const supported = this.generators.filter(g => g.supports(context))

        if (!supported.length) return undefined

        const generator = supported[randomIntBetween(0, supported.length)]
        return generator?.generate(context)
    }
}

const verificationProcessor = new VerificationProcessor()

export default verificationProcessor