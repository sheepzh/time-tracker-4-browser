/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import resource from './merge-rule-resource.json'

export type MergeRuleMessage = {
    removeConfirmMsg: string
    originPlaceholder: string
    mergedPlaceholder: string
    errorOrigin: string
    duplicateMsg: string
    addConfirmMsg: string
    infoAlertTitle: string
    infoAlert0: string
    infoAlert1: string
    infoAlert2: string
    infoAlert3: string
    infoAlert4: string
    infoAlert5: string
    tagResult: {
        blank: string
        level: string
    }
}

const mergeRuleMessages: Messages<MergeRuleMessage> = resource

export default mergeRuleMessages