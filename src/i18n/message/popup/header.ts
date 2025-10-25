/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import resource from './header-resource.json'

export type HeaderMessage = {
    updateVersion: string
    updateVersionInfo: string
    updateVersionInfo4Firefox: string
    rate: string
    showSiteName: string
    showTopN: string
}

const headerMessages = resource satisfies Messages<HeaderMessage>

export default headerMessages