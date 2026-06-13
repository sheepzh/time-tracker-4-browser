/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import resource from './header-resource.json'

export type HeaderMessage = {
    rating: string
    discord: string
    donutChart: string
    showSiteName: string
    showTopN: string
    bug: string
    feature: string
}

const headerMessages = resource satisfies Messages<HeaderMessage>

export default headerMessages