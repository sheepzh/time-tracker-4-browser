/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import resource from './whitelist-resource.json'

export type WhitelistMessage = {
    addConfirmMsg: string
    removeConfirmMsg: string
    duplicateMsg: string
    infoAlertTitle: string
    infoAlert0: string
    infoAlert1: string
    infoAlert2: string
    errorInput: string
}

const _default: Messages<WhitelistMessage> = resource

export default _default