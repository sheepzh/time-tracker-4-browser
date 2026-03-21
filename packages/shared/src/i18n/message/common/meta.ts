/**
 * Copyright (c) 2023-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import resource from './meta-resource.json'

export type MetaMessage = {
    name: string
    marketName: string
    description: string
}

const _default: Required<Messages<MetaMessage>> = resource

export default _default