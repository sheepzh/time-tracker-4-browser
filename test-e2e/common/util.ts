export function sleep(seconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000))
}

export function assertExist<T>(value: T): NonNullable<T> {
    if (value === null || value === undefined) throw new Error('Value does not exist')
    return value
}

export const MOCK_HOST = "127.0.0.1:12345"

export const MOCK_URL = "http://" + MOCK_HOST

const MOCK_HOST_2 = "127.0.0.1:12346"

export const MOCK_URL_2 = "http://" + MOCK_HOST_2
