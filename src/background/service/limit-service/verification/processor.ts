/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { type VerificationContext, type VerificationGenerator, type VerificationPair } from "./common"
import { ALL_GENERATORS } from "./generator"

class VerificationProcessor {
    generators: VerificationGenerator[]

    constructor() {
        this.generators = ALL_GENERATORS
    }

    generate(difficulty: timer.limit.VerificationDifficulty, locale: timer.Locale): VerificationPair | null {
        const context: VerificationContext = { difficulty, locale }
        const supported = this.generators.filter(g => g.supports(context))
        const len = supported?.length
        if (!len) {
            return null
        }
        let generator = supported[0]
        if (len > 1) {
            const idx = Math.floor(Math.random() * supported.length)
            generator = supported[idx]
        }
        return generator.generate(context)
    }
}

export default new VerificationProcessor()