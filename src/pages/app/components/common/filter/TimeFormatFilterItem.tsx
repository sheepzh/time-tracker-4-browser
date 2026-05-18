/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import { defineComponent } from "vue"
import SelectFilterItem from "./SelectFilterItem"

const TIME_FORMAT_LABELS: { [key in tt4b.app.TimeFormat]: string } = {
    default: t(msg => msg.timeFormat.default),
    second: t(msg => msg.timeFormat.second),
    minute: t(msg => msg.timeFormat.minute),
    hour: t(msg => msg.timeFormat.hour)
}

const _default = defineComponent<ModelValue<tt4b.app.TimeFormat>>(props => {
    return () => (
        <SelectFilterItem
            historyName="timeFormat"
            defaultValue={props.modelValue}
            options={TIME_FORMAT_LABELS}
            onChange={val => val && props.onChange?.(val as tt4b.app.TimeFormat)}
        />
    )
}, { props: ['modelValue', 'onChange'] })

export default _default