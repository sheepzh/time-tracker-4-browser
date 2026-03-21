export function handleError(scene: string, e?: any): string | undefined {
    try {
        const lastError = chrome.runtime.lastError ?? (e as Error)
        lastError && console.log(`Errored when ${scene}: ${lastError?.message}`)
        return lastError?.message
    } catch (e) {
        console.info("Can't execute here")
    }
    return undefined
}