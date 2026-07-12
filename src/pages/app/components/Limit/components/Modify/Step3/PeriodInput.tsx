/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from '@app/locale'
import { Check, Close, Plus } from "@element-plus/icons-vue"
import { css } from '@emotion/css'
import { useState, useSwitch, useXsState } from '@hooks'
import Flex from "@pages/components/Flex"
import { dateMinute2Idx, isInPeriod, period2Str } from "@util/limit"
import { MILL_PER_HOUR } from "@util/time"
import { ElButton, ElTag, ElTimePicker, useNamespace } from "element-plus"
import { type StyleValue, computed, defineComponent } from "vue"

const BUTTON_STYLE: StyleValue = {
    padding: '8px',
    height: '32px',
    lineHeight: '32px',
}

const FULL: tt4b.limit.Period = [0, 1440]
const isFull = (p: tt4b.limit.Period): boolean => p[0] === FULL[0] && p[1] === FULL[1]

const mergePeriod = (p1: tt4b.limit.Period, p2: tt4b.limit.Period): tt4b.limit.Period | undefined => {
    if (isFull(p1) || isFull(p2)) return FULL
    // The same single point
    if (p1[0] === p1[1] && p1[1] === p2[0] && p2[0] === p2[1]) return p1

    const isImpact = isInPeriod(p1[0], p2) || isInPeriod(p1[1], p2) || isInPeriod(p2[0], p1) || isInPeriod(p2[1], p1)
    if (!isImpact) return undefined

    const pts: Vector<4> = [p1[0], p1[1], p2[0], p2[1]]
    pts.sort((a, b) => a - b)

    const segments: Vector<2>[] = [
        [pts[0], pts[1]],
        [pts[1], pts[2]],
        [pts[2], pts[3]],
        [pts[3], pts[0]],
    ]

    let gap: tt4b.limit.Period | null = null
    for (const [s, e] of segments) {
        if (s === e) continue
        const mid = s < e ? (s + e) / 2 : (s + e + 1440) / 2 % 1440
        if (!isInPeriod(mid, p1) && !isInPeriod(mid, p2)) {
            gap = [s, e]
            break
        }
    }

    return gap ? [gap[1], gap[0]] : FULL
}

const insertPeriods = (periods: tt4b.limit.Period[], toInsert: tt4b.limit.Period) => {
    periods.push(toInsert)

    let merged = true
    while (merged) {
        merged = false
        for (let i = 0; i < periods.length; i++) {
            const pi = periods[i]
            if (!pi) continue
            for (let j = i + 1; j < periods.length; j++) {
                const pj = periods[j]
                if (!pj) continue

                const newMerged = mergePeriod(pi, pj)
                if (newMerged) {
                    periods[i] = newMerged
                    periods.splice(j, 1)
                    merged = true
                    break
                }
            }
            if (merged) break
        }
    }
    periods.sort((a, b) => a[0] - b[0])
}

const rangeInitial = (): [Date, Date] => {
    const now = Date.now()
    return [new Date(now), new Date(now + MILL_PER_HOUR)]
}

const useRange = () => {
    const initial = rangeInitial()
    const [start, setStart] = useState(initial[0])
    const [end, setEnd] = useState(initial[1])
    const init = () => {
        const initial = rangeInitial()
        setStart(initial[0])
        setEnd(initial[1])
    }
    const period = computed<tt4b.limit.Period>(() => [dateMinute2Idx(start.value), dateMinute2Idx(end.value)])
    const endFormat = computed(() => {
        const [s, e] = period.value
        return s <= e ? 'HH:mm' : 'HH:mm(+1)'
    })
    return { start, end, setStart, setEnd, init, period, endFormat }
}

const useRangeWrapperStyle = () => css`
    border: 1px solid var(--el-border-color);
    border-right: none;
    border-top-left-radius: var(--el-border-radius-base);
    border-bottom-left-radius: var(--el-border-radius-base);
    background-color: var(--el-input-bg-color, var(--el-fill-color-blank));
    padding: 0 4px;
    height: 32px;
    box-sizing: border-box;
    transition: border-color var(--el-transition-duration);

    &:hover {
        border-color: var(--el-border-color-hover);
    }
    &:focus-within {
        border-color: var(--el-color-primary);
    }
`

const usePickerStyle = () => {
    const inputNs = useNamespace('input')
    return css`
        width: 62px !important;

        & .${inputNs.e('wrapper')} {
            box-shadow: none !important;
            padding: 0 !important;
            background: transparent !important;
        }
        
        & .${inputNs.e('inner')} {
            text-align: center;
            height: 28px;
        }

        // Hide the timer icon
        & .${inputNs.e('prefix')} {
            display: none !important;
        }
    `
}

const PeriodInput = defineComponent<ModelValue<tt4b.limit.Period[]>>(props => {
    const [editing, openEditing, closeEditing] = useSwitch(false)
    const { start, end, setStart, setEnd, init, period, endFormat } = useRange()
    const isXs = useXsState()

    const handleEdit = () => {
        openEditing()
        init()
    }

    const handleSave = () => {
        const oldPeriods = props.modelValue.map(p => [p[0], p[1]] satisfies tt4b.limit.Period)
        insertPeriods(oldPeriods, period.value)
        props.onChange?.(oldPeriods)
        closeEditing()
    }

    const handleDelete = (idx: number) => {
        const newPeriods = props.modelValue.filter((_, i) => i !== idx)
            .map(p => [p[0], p[1]] satisfies tt4b.limit.Period)
        props.onChange?.(newPeriods)
    }

    const wrapperCls = useRangeWrapperStyle()
    const pickerCls = usePickerStyle()

    return () => (
        <Flex gap={5} column={isXs.value}>
            <Flex v-show={props.modelValue.length} gap={5} wrap>
                {props.modelValue.map((p, idx) => p && (
                    <ElTag
                        key={idx}
                        size={isXs.value ? 'small' : 'large'}
                        closable
                        onClose={() => handleDelete(idx)}
                    >
                        {period2Str(p)}
                    </ElTag>
                ))}
            </Flex>
            <Flex v-show={editing.value} wrap={false}>
                <Flex align='center' class={wrapperCls} gap={2}>
                    <ElTimePicker
                        class={pickerCls}
                        modelValue={start.value}
                        onUpdate:modelValue={val => val && setStart(val)}
                        format="HH:mm"
                        clearable={false}
                    />
                    <span style={{ color: 'var(--el-text-color-secondary)' }}>-</span>
                    <ElTimePicker
                        class={pickerCls}
                        modelValue={end.value}
                        onUpdate:modelValue={val => val && setEnd(val)}
                        format={endFormat.value}
                        clearable={false}
                    />
                </Flex>
                <ElButton
                    icon={Close}
                    onClick={closeEditing}
                    style={{ ...BUTTON_STYLE, borderRadius: 0 } satisfies StyleValue}
                />
                <ElButton
                    icon={Check}
                    onClick={handleSave}
                    style={{ ...BUTTON_STYLE, marginInlineStart: 0 } satisfies StyleValue}
                />
            </Flex>
            <Flex>
                <ElButton
                    v-show={!editing.value}
                    icon={Plus}
                    onClick={handleEdit}
                    style={BUTTON_STYLE}
                    size={isXs.value ? 'small' : undefined}
                >
                    {t(msg => msg.button.create)}
                </ElButton>
            </Flex>
        </Flex>
    )
}, { props: ['modelValue', 'onChange'] })

export default PeriodInput