/**
 * Copyright (c) 2023-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import resource from './button-resource.json'

export type ButtonMessage = {
    create: string
    add: string
    delete: string
    batchDelete: string
    modify: string
    save: string
    test: string
    confirm: string
    cancel: string
    previous: string
    next: string
    okey: string
    dont: string
    operation: string
    configuration: string
    clear: string
    enable: string
    batchEnable: string
    batchDisable: string
    collapse: string
    expand: string
}

const _default: Messages<ButtonMessage> = resource

export default _default