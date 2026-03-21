/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import resource from './operation-resource.json'

export type OperationMessage = {
    confirmTitle: string
    successMsg: string
}

const _default: Messages<OperationMessage> = resource

export default _default