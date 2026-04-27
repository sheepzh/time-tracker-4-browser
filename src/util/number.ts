/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

/**
 * @since 0.6.0
 * @returns [true, intValue] if str is an integer, or [false, str]
 */
export function tryParseInteger(str: string): [true, number] | [false, string] {
    const num: number = Number.parseInt(str)
    const isInteger: boolean = !isNaN(num) && num.toString().length === str.length
    return isInteger ? [true, num] : [false, str]
}

/**
 * Generate random integer between {@param lowerInclusive} and {@param upperExclusive}
 */
export function randomIntBetween(lowerInclusive: number, upperExclusive: number): number {
    return Math.floor(Math.random() * (upperExclusive - lowerInclusive)) + lowerInclusive
}

export const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v))