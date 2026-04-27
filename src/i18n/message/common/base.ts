/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import resource from './base-resource.json'

export type BaseMessage = {
    allFunction: string
    guidePage: string
    changeLog: string
    option: string
    sourceCode: string
    limit: string
    helpUs: string
}

/**
 * Use for chrome
 */
const _default: Messages<BaseMessage> = resource

export default _default