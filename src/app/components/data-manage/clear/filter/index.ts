/**
 * Copyright (c) 2021 Hengyang Zhang
 * 
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type { Ref, SetupContext } from "vue"

import { Delete } from "@element-plus/icons-vue"
import { defineComponent, h, ref } from "vue"
import TimerDatabase from "@db/timer-database"
import { t } from "@app/locale"
import dateFilter from "./date-filter"
import numberFilter from "./number-filter"
import operationButton, { BaseFilterProps } from "./operation-button"

const timerDatabase = new TimerDatabase(chrome.storage.local)

const dateRangeRef: Ref<Array<Date>> = ref([])
const focusStartRef: Ref<string> = ref('0')
const focusEndRef: Ref<string> = ref('2')
const totalStartRef: Ref<string> = ref('0')
const totalEndRef: Ref<string> = ref('')
const timeStartRef: Ref<string> = ref('0')
const timeEndRef: Ref<string> = ref('')

const title = h('h3', t(msg => msg.dataManage.filterItems))

const filterRefs: BaseFilterProps = {
    dateRangeRef,
    focusStartRef, focusEndRef,
    totalStartRef, totalEndRef,
    timeStartRef, timeEndRef,
}

const deleteButton = (onDateChanged: () => void) => operationButton({
    ...filterRefs,
    onDateChanged,

    confirm: {
        message: 'deleteConfirm',
        operation: result => timerDatabase.delete(result),
        resultMessage: 'deleteSuccess'
    },

    button: {
        message: 'delete',
        icon: Delete,
        type: 'danger'
    }
})

const _default = defineComponent((_props, ctx: SetupContext) => {
    const onDateChanged = ctx.attrs.onDateChanged as () => void

    const footer = () => h('div', { class: 'footer-container filter-container' }, deleteButton(onDateChanged))

    return () => h('div', { class: 'clear-panel' },
        [
            title,
            dateFilter({ dateRangeRef }),
            numberFilter('filterFocus', focusStartRef, focusEndRef, 2),
            numberFilter('filterTotal', totalStartRef, totalEndRef, 3),
            numberFilter('filterTime', timeStartRef, timeEndRef, 4),
            footer()
        ]
    )
})

export default _default