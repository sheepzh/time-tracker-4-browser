/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import resource from './menu-resource.json'

export type MenuMessage = {
    tracking: string
    dashboard: string
    record: string
    sites: string
    rule: string
    analysis: string
    siteAnalysis: string
    habit: string
    productivity: string
    other: string
    migration: string
    about: string
}

const _default: Messages<MenuMessage> = resource

export default _default