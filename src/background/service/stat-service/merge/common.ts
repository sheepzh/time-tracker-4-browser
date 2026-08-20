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
    c1?.focus?.forEach(e => accCompositionValue(focusMap, e))
    c2?.focus?.forEach(e => accCompositionValue(focusMap, e))
    c1?.time?.forEach(e => accCompositionValue(timeMap, e))
    c2?.time?.forEach(e => accCompositionValue(timeMap, e))

    return {
        focus: Object.values(focusMap),
        time: Object.values(timeMap),
    }
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
    const { focus, time, run, media } = delta
    target.focus += focus ?? 0
    target.time += time ?? 0
    target.run = (target.run ?? 0) + (run ?? 0)
    target.media = (target.media ?? 0) + (media ?? 0)
    if (!isGroup(target) && !isGroup(delta)) {
        target.composition = mergeComposition(target.composition, delta.composition)
    }
}