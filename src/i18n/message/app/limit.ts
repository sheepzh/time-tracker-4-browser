/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import resource from './limit-resource.json'

export type LimitMessage = {
    onlyEffective: string
    wildcardTip: string
    emptyTips: string
    step: {
        base: string
        url: string
        rule: string
    }
    item: {
        name: string
        condition: string
        weekStartInfo: string
        visitTime: string
        enabled: string
        locked: string
        effectiveDay: string
        allowDelay: string
        delayCount: string
        detail: string
        or: string
        notEffective: string
    }
    button: {
        test: string
    }
    message: {
        noUrl: string
        noRule: string
        deleteConfirm: string
        lockConfirm: string
        inputTestUrl: string
        noRuleMatched: string
        rulesMatched: string
        timeout: string
    }
    verification: {
        inputTip: string
        inputTip2: string
        pswInputTip: string
        strictTip: string
        incorrectPsw: string
        incorrectAnswer: string
        pi: string
        confession: string
    }
    reminder: string
}

const _default: Messages<LimitMessage> = resource

export default _default
