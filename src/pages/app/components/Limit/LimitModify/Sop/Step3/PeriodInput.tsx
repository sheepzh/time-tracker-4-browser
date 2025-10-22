/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import { Check, Close, Plus } from "@element-plus/icons-vue"
import { css } from '@emotion/css'
import { useState, useSwitch } from "@hooks"
import Flex from "@pages/components/Flex"
import { dateMinute2Idx, period2Str } from "@util/limit"
import { MILL_PER_HOUR } from "@util/time"
import { ElButton, ElTag, ElTimePicker, useNamespace } from "element-plus"
import { type StyleValue, defineComponent } from "vue"

const useStyle = () => {
    const dateEditorNs = useNamespace('date-editor')
    const rangeNs = useNamespace('range')

    const btnClz = css`
        padding: 8px;
        height: 32px;
        line-height: 32px;
    `
    const dateEditorClz = css`
        &.${dateEditorNs.b()} {
            width: 120px !important;
            padding: 0 5px !important;
            border-top-right-radius: 0px;
            border-bottom-right-radius: 0px;

            .${rangeNs.e('close-icon')} {
                width: 0px;
                .${rangeNs.b('input')} {
                    height: 28px;
                }
            }
        }
    `
    return { btnClz, dateEditorClz }
}

const range2Period = (range: [Date, Date]): [number, number] => {
    const [start, end] = range
    const startIdx = dateMinute2Idx(start)
    const endIdx = dateMinute2Idx(end)
    return [Math.min(startIdx, endIdx), Math.max(startIdx, endIdx)]
}

const insertPeriods = (periods: timer.limit.Period[], toInsert: timer.limit.Period) => {
    if (!toInsert || !periods) return
    let len = periods.length
    if (!len) {
        periods.push(toInsert)
        return
    }
    for (let i = 0; i < len; i++) {
        const pre = periods[i]
        const next = periods[i + 1]
        if (checkImpact(pre, toInsert)) {
            mergePeriod(pre, toInsert)
            if (checkImpact(pre, next)) {
                mergePeriod(pre, next)
                periods.splice(i + 1, 1)
            }
            return
        }
        if (checkImpact(toInsert, next)) {
            mergePeriod(next, toInsert)
            return
        }
    }
    // Append
    periods.push(toInsert)
    periods.sort((a, b) => a[0] - b[0])
}

const mergePeriod = (target: timer.limit.Period, toMerge: timer.limit.Period) => {
    if (!target || !toMerge) return
    target[0] = Math.min(target[0], toMerge[0])
    target[1] = Math.max(target[1], toMerge[1])
}

const checkImpact = (p1: timer.limit.Period, p2: timer.limit.Period): boolean => {
    if (!p1 || !p2) return false
    const [s1, e1] = p1
    const [s2, e2] = p2
    return (s1 >= s2 && s1 <= e2) || (s2 >= s1 && s2 <= e1)
}

const rangeInitial = (): [Date, Date] => {
    const now = new Date()
    return [now, new Date(now.getTime() + MILL_PER_HOUR)]
}

const _default = defineComponent<{ modelValue?: timer.limit.Period[], onChange?: ArgCallback<timer.limit.Period[]> }>((props, ctx) => {
    const [editing, openEditing, closeEditing] = useSwitch(false)
    const [editingRange, setEditingRange] = useState(rangeInitial())

    const handleEdit = () => {
        openEditing()
        setEditingRange(rangeInitial())
    }

    const handleSave = () => {
        const val = range2Period(editingRange.value)
        const oldPeriods = props.modelValue?.map(p => ([p?.[0], p?.[1]] satisfies Vector<number>)) || []
        insertPeriods(oldPeriods, val)
        ctx.emit('change', oldPeriods)
        closeEditing()
    }

    const handleDelete = (idx: number) => {
        const newPeriods = props.modelValue?.filter((_, i) => i !== idx)
            ?.map(p => ([p?.[0], p?.[1]] satisfies Vector<number>)) || []
        ctx.emit('change', newPeriods)
    }

    const { btnClz, dateEditorClz } = useStyle()

    return () => (
        <Flex gap={5}>
            {props.modelValue?.map((p, idx) =>
                <ElTag size="large" closable onClose={() => handleDelete(idx)}>
                    {period2Str(p)}
                </ElTag>
            )}
            <div v-show={editing.value}>
                <ElTimePicker
                    class={dateEditorClz}
                    modelValue={editingRange.value}
                    onUpdate:modelValue={setEditingRange}
                    isRange
                    rangeSeparator="-"
                    format="HH:mm"
                    clearable={false}
                />
                <ElButton
                    icon={Close}
                    onClick={closeEditing}
                    class={btnClz}
                    style={{ borderRadius: 0 } satisfies StyleValue}
                />
                <ElButton
                    icon={Check}
                    onClick={handleSave}
                    class={btnClz}
                    style={{ marginInlineStart: 0 } satisfies StyleValue}
                />
            </div>
            <ElButton v-show={!editing.value} icon={Plus} class={btnClz} onClick={handleEdit}>
                {t(msg => msg.button.create)}
            </ElButton>
        </Flex>
    )
}, { props: ['modelValue', 'onChange'] })

export default _default