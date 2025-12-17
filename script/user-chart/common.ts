import { findTarget, type Gist } from "@api/gist"
import { exitWith } from "../util/process"

export type Browser =
    | 'chrome'
    | 'firefox'
    | 'edge'

export type UserCount = Record<string, number>

/**
 * Validate the token from environment variables
 */
export function validateTokenFromEnv(): string {
    const token = process.env.TIMER_USER_COUNT_GIST_TOKEN
    if (!token) {
        exitWith("Can't find token from env variable [TIMER_USER_COUNT_GIST_TOKEN]")
    }
    return token!
}

/**
 * Calculate the gist description of target browser
 */
export function descriptionOf(browser: Browser): string {
    return `Timer_UserCount_4_${browser}`
}

/**
 * Calculate the gist filename of target browser
 */
export function filenameOf(browser: Browser): string {
    return descriptionOf(browser) + '.json'
}

export async function getExistGist(token: string, browser: Browser): Promise<Gist | null> {
    return await findTarget(token, gist => gist.description === descriptionOf(browser))
}