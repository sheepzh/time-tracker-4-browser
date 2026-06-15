import { exitWith } from './process'

/**
 * Validate the token from environment variables
 */
export function validateTokenFromEnv(): string {
    const token = process.env.TIMER_USER_COUNT_GIST_TOKEN
    if (!token) {
        exitWith("Can't find token from env variable [TIMER_USER_COUNT_GIST_TOKEN]")
    }
    return token
}