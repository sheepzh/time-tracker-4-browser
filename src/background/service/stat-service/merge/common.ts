/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { isGroup } from "@util/stat"

type _RemoteCompositionMap = Record<'_' | string, tt4b.stat.RemoteCompositionVal>

function mergeComposition(c1: tt4b.stat.RemoteComposition | undefined, c2: tt4b.stat.RemoteComposition | undefined): tt4b.stat.RemoteComposition {
    const focusMap: _RemoteCompositionMap = {}
    const timeMap: _RemoteCompositionMap = {}
    const runMap: _RemoteCompositionMap = {}
    c1?.focus?.forEach(e => accCompositionValue(focusMap, e))
    c2?.focus?.forEach(e => accCompositionValue(focusMap, e))
    c1?.time?.forEach(e => accCompositionValue(timeMap, e))
    c2?.time?.forEach(e => accCompositionValue(timeMap, e))
    c1?.run?.forEach(e => accCompositionValue(runMap, e))
    c2?.run?.forEach(e => accCompositionValue(runMap, e))

    const result = {
        focus: Object.values(focusMap),
        time: Object.values(timeMap),
        run: Object.values(runMap),
    }
    return result
}

function accCompositionValue(map: _RemoteCompositionMap, value: tt4b.stat.RemoteCompositionVal) {
    if (typeof value === 'number') {
        const cid = '_'
        const existVal = map[cid]
        if (!existVal || typeof existVal !== 'number') {
            map[cid] = value
        } else {
            map[cid] = existVal + value
        }
    } else {
        const cid = value.cid
        const existVal = map[cid]
        if (!existVal || typeof existVal === 'number') {
            map[cid] = value
        } else {
            existVal.value = existVal.value + value.value
        }
    }
}

export function mergeResult(target: tt4b.stat.Row, delta: tt4b.stat.Row) {
    const { focus, time } = delta
    target.focus += focus ?? 0
    target.time += time ?? 0
    if (!isGroup(target) && !isGroup(delta)) {
        target.composition = mergeComposition(target.composition, delta.composition)
    }
}