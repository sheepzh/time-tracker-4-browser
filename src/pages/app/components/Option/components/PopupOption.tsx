/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { IS_ANDROID } from "@util/constant/environment"
import { defaultPopup } from "@util/constant/option"
import { ElInputNumber, ElSwitch } from "element-plus"
import { defineComponent } from "vue"
import { type OptionInstance } from "../common"
import { useOption } from "../useOption"
import OptionItem from "./OptionItem"
import OptionLines from './OptionLines'

const defaultVal = defaultPopup()

function copy(target: timer.option.PopupOption, source: timer.option.PopupOption) {
    target.displaySiteName = source.displaySiteName
    target.popupMax = source.popupMax
}

const PopupOption = defineComponent<{}>((_, ctx) => {
    const { option } = useOption({ defaultValue: defaultPopup, copy })

    ctx.expose({
        reset: () => copy(option, defaultPopup())
    } satisfies OptionInstance)

    return () => <OptionLines>
        <OptionItem label={msg => msg.option.popup.max} defaultValue={defaultVal.popupMax}>
            <ElInputNumber
                modelValue={option.popupMax}
                size="small"
                min={5}
                max={100}
                onChange={val => option.popupMax = val!}
            />
        </OptionItem>
        {!IS_ANDROID && (
            <OptionItem label={msg => msg.option.popup.displaySiteName} defaultValue={true}>
                <ElSwitch
                    modelValue={option.displaySiteName}
                    onChange={val => option.displaySiteName = val as boolean}
                />
            </OptionItem>
        )}
    </OptionLines>
})

export default PopupOption
