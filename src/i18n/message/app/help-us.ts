/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import resource from './help-us-resource.json'

type _AlertLine =
    | 'l1'
    | 'l2'
    | 'l3'

export type HelpUsMessage = {
    title: string
    alert: { [line in _AlertLine]: string }
    button: string
    loading: string
    contributors: string
}

const _default: Messages<HelpUsMessage> = resource

export default _default