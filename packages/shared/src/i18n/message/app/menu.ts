/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import resource from './menu-resource.json'

export type MenuMessage = {
    dashboard: string
    data: string
    dataReport: string
    siteAnalysis: string
    dataClear: string
    behavior: string
    habit: string
    limit: string
    additional: string
    siteManage: string
    whitelist: string
    mergeRule: string
    other: string
    helpUs: string
    about: string
}

const _default: Messages<MenuMessage> = resource

export default _default