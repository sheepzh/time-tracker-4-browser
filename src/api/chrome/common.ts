export function handleError(scene: string, e?: any): string | undefined {
    try {
        const lastError = chrome.runtime.lastError ?? (e as Error)
        const message = lastError?.message
        if (message && isIgnorableRuntimeError(message)) {
            return message
        }
        message && console.log(`Errored when ${scene}: ${message}`)
        return message
    } catch {
        console.info("Can't execute here")
    }
    return undefined
}

const IGNORABLE_RUNTIME_ERRORS = [
    'Receiving end does not exist',
    'Could not establish connection',
    'The message port closed before a response was received',
    'No tab with id',
]

function isIgnorableRuntimeError(message: string): boolean {
    return IGNORABLE_RUNTIME_ERRORS.some(fragment => message.includes(fragment))
}