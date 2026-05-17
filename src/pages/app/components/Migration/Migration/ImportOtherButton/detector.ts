import { IS_CHROME, IS_EDGE } from '@util/constant/environment'

const WATT_CHROME_ID = 'hhfnghjdeddcfegfekjeihfmbjenlomm'
const WATT_EDGE_ID = 'eepmlmdenlkkjieghjmedjahpofieogf'
const WATT_RES_URL = '/assets/pomodoro-sounds/1.mp3'
export async function detectWatt(): Promise<boolean> {
    if (IS_CHROME) {
        return await fetchChrome(WATT_CHROME_ID, WATT_RES_URL)
    } else if (IS_EDGE) {
        return await fetchChrome(WATT_CHROME_ID, WATT_RES_URL) || await fetchChrome(WATT_EDGE_ID, WATT_RES_URL)
    }
    return false
}

async function fetchChrome(id: string, uri: string) {
    const url = `chrome-extension://${id}${uri}`
    try {
        const resp = await fetch(url, { method: 'HEAD' })
        return resp.status === 200
    } catch {
        return false
    }
}