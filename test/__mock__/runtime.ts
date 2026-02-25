export const mockRuntime = () => {
    global.chrome = {
        runtime: {
            id: 'mock_runtime_id',
        } satisfies Pick<typeof chrome.runtime, 'id'>
    } as unknown as typeof global.chrome
}