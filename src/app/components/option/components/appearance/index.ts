/**
 * Copyright (c) 2021 Hengyang Zhang
 * 
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type { Ref } from "vue"

import { ElDivider, ElMessageBox, ElOption, ElSelect, ElSwitch } from "element-plus"
import { defineComponent, h, ref } from "vue"
import optionService from "@service/option-service"
import { defaultAppearance } from "@util/constant/option"
import DarkModeInput from "./dark-mode-input"
import { t, tWith } from "@app/locale"
import { renderOptionItem, tagText } from "../../common"
import localeMessages from "@util/i18n/components/locale"
import { localeSameAsBrowser } from "@util/i18n"
import { toggle } from "@util/dark-mode"

const displayWhitelist = (option: Ref<timer.option.AppearanceOption>) => h(ElSwitch, {
    modelValue: option.value.displayWhitelistMenu,
    onChange: (newVal: boolean) => {
        option.value.displayWhitelistMenu = newVal
        optionService.setAppearanceOption(option.value)
    }
})

const displayBadgeText = (option: Ref<timer.option.AppearanceOption>) => h(ElSwitch, {
    modelValue: option.value.displayBadgeText,
    onChange: (newVal: boolean) => {
        option.value.displayBadgeText = newVal
        optionService.setAppearanceOption(option.value)
    }
})

const printInConsole = (option: Ref<timer.option.AppearanceOption>) => h(ElSwitch, {
    modelValue: option.value.printInConsole,
    onChange: (newVal: boolean) => {
        option.value.printInConsole = newVal
        optionService.setAppearanceOption(option.value)
    }
})

const allLocales: timer.Locale[] = (["zh_CN", "zh_TW", "en", "ja"] as timer.Locale[])
    // Keep the locale same as this browser first position
    .sort((a, _b) => a === localeSameAsBrowser ? -1 : 0)
const allLocaleOptions: timer.option.LocaleOption[] = ["default", ...allLocales]

const locale = (option: Ref<timer.option.AppearanceOption>) => h(ElSelect, {
    modelValue: option.value.locale,
    size: 'small',
    style: { width: '120px' },
    onChange: async (newVal: timer.option.LocaleOption) => {
        option.value.locale = newVal
        await optionService.setAppearanceOption(option.value)
        // await maybe not work in Firefox, so calculate the real locale again
        // GG Firefox
        const realLocale: timer.Locale = newVal === "default"
            ? localeSameAsBrowser
            : newVal
        ElMessageBox({
            message: tWith(msg => msg.option.appearance.locale.changeConfirm, realLocale),
            type: "success",
            confirmButtonText: t(msg => msg.option.appearance.locale.reloadButton),
            // Cant close this on press ESC
            closeOnPressEscape: false,
            // Cant close this on clicking modal
            closeOnClickModal: false
        }).then(() => { location.reload?.() })
            .catch(() => {/* do nothing */ })
    }
}, {
    default: () => allLocaleOptions.map(
        locale => h(ElOption, {
            value: locale, label: locale === "default"
                ? t(msg => msg.option.appearance.locale.default)
                : localeMessages[locale].name
        })
    )
})

const _default = defineComponent({
    name: "AppearanceOptionContainer",
    setup(_props, ctx) {
        const option: Ref<timer.option.AppearanceOption> = ref(defaultAppearance())
        optionService.getAllOption().then(currentVal => {
            option.value = currentVal
        })
        ctx.expose({
            async reset() {
                option.value = defaultAppearance()
                await optionService.setAppearanceOption(option.value)
                toggle(await optionService.isDarkMode(option.value))
            }
        })
        return () => h('div', [
            renderOptionItem({
                input: h(DarkModeInput, {
                    modelValue: option.value.darkMode,
                    startSecond: option.value.darkModeTimeStart,
                    endSecond: option.value.darkModeTimeEnd,
                    onChange: async (darkMode, range) => {
                        option.value.darkMode = darkMode
                        option.value.darkModeTimeStart = range?.[0]
                        option.value.darkModeTimeEnd = range?.[1]
                        await optionService.setAppearanceOption(option.value)
                        toggle(await optionService.isDarkMode())
                    }
                })
            },
                msg => msg.appearance.darkMode.label,
                t(msg => msg.option.appearance.darkMode.options["off"])),
            h(ElDivider),
            renderOptionItem({
                input: locale(option)
            },
                msg => msg.appearance.locale.label,
                t(msg => msg.option.appearance.locale.default)
            ),
            h(ElDivider),
            renderOptionItem({
                input: displayWhitelist(option),
                whitelist: tagText(msg => msg.option.appearance.whitelistItem),
                contextMenu: tagText(msg => msg.option.appearance.contextMenu)
            }, msg => msg.appearance.displayWhitelist, t(msg => msg.option.yes)),
            h(ElDivider),
            renderOptionItem({
                input: displayBadgeText(option),
                timeInfo: tagText(msg => msg.option.appearance.badgeTextContent),
                icon: tagText(msg => msg.option.appearance.icon)
            }, msg => msg.appearance.displayBadgeText, t(msg => msg.option.yes)),
            h(ElDivider),
            renderOptionItem({
                input: printInConsole(option),
                console: tagText(msg => msg.option.appearance.printInConsole.console),
                info: tagText(msg => msg.option.appearance.printInConsole.info)
            }, msg => msg.appearance.printInConsole.label, t(msg => msg.option.yes))
        ])
    }
})

export default _default