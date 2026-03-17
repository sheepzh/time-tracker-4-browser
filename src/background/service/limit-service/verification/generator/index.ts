/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { type VerificationGenerator } from "../common"
import ConfessionGenerator from "./confession"
import PiGenerator from "./pi"
import UglyGenerator from "./ugly"
import UncommonChinese from "./uncommon-chinese"

export const ALL_GENERATORS: VerificationGenerator[] = [
    new PiGenerator(),
    new ConfessionGenerator(),
    new UglyGenerator(),
    new UncommonChinese(),
]