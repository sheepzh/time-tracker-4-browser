/**
 * Copyright (c) 2021 Hengyang Zhang
 * 
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type { Ref } from "vue"

import { ElDivider, ElInputNumber, ElOption, ElSelect, ElSwitch } from "element-plus"
import { t } from "@app/locale"
import { defineComponent, h, ref } from "vue"
import optionService from "@service/option-service"
import { renderOptionItem, tagText } from "../common"
import { defaultPopup } from "@util/constant/option"
import { ALL_POPUP_DURATION } from "@util/constant/popup"
import { ALL_DIMENSIONS } from "@util/stat"

const popupMaxInput = (option: Ref<timer.option.PopupOption>) => h(ElInputNumber, {
    modelValue: option.value.popupMax,
    size: 'small',
    min: 5,
    max: 30,
    onChange: (val: number) => {
        option.value.popupMax = val
        optionService.setPopupOption(option.value)
    }
})

const typeOptions = () => ALL_DIMENSIONS.map(item => h(ElOption, { value: item, label: t(msg => msg.item[item]) }))
const typeSelect = (option: Ref<timer.option.PopupOption>) => h(ElSelect, {
    modelValue: option.value.defaultType,
    size: 'small',
    style: { width: '120px' },
    onChange: (val: timer.stat.Dimension) => {
        option.value.defaultType = val
        optionService.setPopupOption(option.value)
    }
}, { default: typeOptions })

const durationOptions = () => ALL_POPUP_DURATION.map(item => h(ElOption, { value: item, label: t(msg => msg.option.popup.duration[item]) }))
const durationSelect = (option: Ref<timer.option.PopupOption>) => h(ElSelect, {
    modelValue: option.value.defaultDuration,
    size: 'small',
    style: { width: t(msg => msg.option.popup.durationWidth) },
    onChange: (val: timer.popup.Duration) => {
        option.value.defaultDuration = val
        optionService.setPopupOption(option.value)
    }
}, { default: durationOptions })

const displaySiteName = (option: Ref<timer.option.PopupOption>) => h(ElSwitch, {
    modelValue: option.value.displaySiteName,
    onChange: (newVal: boolean) => {
        option.value.displaySiteName = newVal
        optionService.setPopupOption(option.value)
    }
})

const defaultPopOptions = defaultPopup()
const defaultTypeLabel = t(msg => msg.item[defaultPopOptions.defaultType])
const defaultDurationLabel = t(msg => msg.option.popup.duration[defaultPopOptions.defaultDuration])
const displayDefaultLabel = `${defaultDurationLabel}/${defaultTypeLabel}`

const _default = defineComponent({
    name: "PopupOptionContainer",
    setup(_props, ctx) {
        const option: Ref<timer.option.PopupOption> = ref(defaultPopup())
        optionService.getAllOption().then(currentVal => option.value = currentVal)
        ctx.expose({
            async reset() {
                option.value = defaultPopup()
                await optionService.setPopupOption(option.value)
            }
        })
        return () => h('div', [
            renderOptionItem({
                duration: durationSelect(option),
                type: typeSelect(option)
            },
                msg => msg.popup.defaultDisplay,
                displayDefaultLabel
            ),
            h(ElDivider),
            renderOptionItem(popupMaxInput(option), msg => msg.popup.max, defaultPopOptions.popupMax),
            h(ElDivider),
            renderOptionItem({
                input: displaySiteName(option),
                siteName: tagText(msg => msg.option.statistics.siteName)
            }, msg => msg.popup.displaySiteName, t(msg => msg.option.yes))
        ])
    }
})

export default _default