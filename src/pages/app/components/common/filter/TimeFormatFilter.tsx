/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import type { FunctionalComponent } from "vue"
import SelectFilterItem from "./SelectFilter"

const TIME_FORMAT_LABELS: { [key in tt4b.ui.TimeFormat]: string } = {
    default: t(msg => msg.timeFormat.default),
    second: t(msg => msg.timeFormat.second),
    minute: t(msg => msg.timeFormat.minute),
    hour: t(msg => msg.timeFormat.hour)
}

const TimeFormatFilter: FunctionalComponent<ModelValue<tt4b.ui.TimeFormat>> = props => (
    <SelectFilterItem
        modelValue={props.modelValue}
        options={TIME_FORMAT_LABELS}
        onChange={val => val && props.onChange?.(val as tt4b.ui.TimeFormat)}
    />
)
TimeFormatFilter.displayName = 'TimeFormatFilter'

export default TimeFormatFilter