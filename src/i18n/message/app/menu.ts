/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import resource from './menu-resource.json'

export type MenuMessage = {
    overview: string
    dashboard: string
    record: string
    analysis: string

    productivity: string
    habit: string
    focus: string

    siteRule: string
    sites: string
    whitelist: string
    mergeRule: string

    other: string
    migration: string
    about: string
}

const _default: Messages<MenuMessage> = resource

export default _default