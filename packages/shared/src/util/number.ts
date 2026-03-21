/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

/**
 * @since 0.6.0
 * @returns T/F
 */
export function isInteger(str: string): boolean {
    return tryParseInteger(str)[0]
}

/**
 * @since 0.6.0
 * @returns [true, intValue] if str is an integer, or [false, str]
 */
export function tryParseInteger(str: string): [boolean, number | string] {
    const num: number = Number.parseInt(str)
    const isInteger: boolean = !isNaN(num) && num.toString().length === str.length
    return [isInteger, isInteger ? num : str]
}

/**
 * Generate random integer between {@param lowerInclusive} and {@param upperExclusive}
 */
export function randomIntBetween(lowerInclusive: number, upperExclusive: number): number {
    return Math.floor(Math.random() * (upperExclusive - lowerInclusive)) + lowerInclusive
}