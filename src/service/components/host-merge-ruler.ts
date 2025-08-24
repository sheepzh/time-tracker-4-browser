/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { isIpAndPort, judgeVirtualFast } from "@util/pattern"
import { get } from "@util/psl"

/**
 * @param origin origin host
 * @param dotCount the count of dots to remain
 */
const getTheSuffix = (origin: string, dotCount: number) => {
    if (isIpAndPort(origin)) return origin

    let result: string[] = []
    while (true) {
        if (dotCount-- < 0) {
            break
        }
        if (!origin.includes('.')) {
            result.push(origin)
            break
        }

        const index = origin.lastIndexOf('.')
        result.push(origin.substring(index + 1))
        origin = origin.substring(0, index)
    }
    return result.reverse().join('.')
}

type RegRuleItem = {
    reg: RegExp
    result: string | number
}

const processRegStr = (regStr: string) => regStr
    .split('.').join('\\.')
    .split('**').join('.+')
    .split('*').join('[^\\.]+')

function convert(dbItem: timer.merge.Rule): RegRuleItem | [string, string | number] {
    const { origin, merged } = dbItem
    if (origin.includes('*')) {
        const regStr = processRegStr(origin)
        const reg = new RegExp('^' + regStr + '$')
        return { reg, result: merged } as RegRuleItem
    } else {
        return [origin, merged]
    }
}

export default class CustomizedHostMergeRuler {
    private noRegMergeRules: { [origin: string]: string | number } = {}

    private regulars: RegRuleItem[] = []

    private cache: Record<string, string> = {}

    constructor(rules: timer.merge.Rule[]) {
        rules.map(item => convert(item))
            .forEach(rule => Array.isArray(rule)
                ? (this.noRegMergeRules[rule[0]] = rule[1] || rule[0])
                : (this.regulars.push(rule)))
    }

    merge(origin: string): string {
        let result = this.cache[origin]
        if (result) return result
        result = this.cache[origin] = this.mergeInner(origin)
        return result
    }

    /**
     * @param origin origin host
     * @returns merged host
     */
    private mergeInner(origin: string): string {
        let host = origin
        if (judgeVirtualFast(origin)) {
            host = origin.split('/')?.[0]
            if (!host) {
                return origin
            }
        }
        // First check the static rules
        let merged = this.noRegMergeRules[host]
        // Then check the regular rules
        let matchResult: undefined | RegRuleItem = undefined
        merged === undefined && (matchResult = this.regulars.find(item => item.reg.test(host)))
        matchResult && (merged = matchResult.result)
        if (merged === undefined) {
            // No rule matched
            return isIpAndPort(host)
                ? host
                : get(host) || this.merge0(2, host)
        } else {
            return this.merge0(merged, host)
        }
    }

    private merge0(merged: string | number, origin: string): string {
        return typeof merged === 'string' ? (merged === '' ? origin : merged) : getTheSuffix(origin, merged)
    }
}
