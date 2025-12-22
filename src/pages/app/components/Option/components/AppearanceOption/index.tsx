/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { isSidePanelEnabled, setSidePanelEnabled, SIDE_PANEL_STATE_SUPPORTED_CONTROL } from '@api/chrome/sidePanel'
import { type I18nKey, t, tWith } from "@app/locale"
import { useRequest } from '@hooks/useRequest'
import { ALL_LOCALES, localeSameAsBrowser } from "@i18n"
import localeMessages from "@i18n/message/common/locale"
import optionService from "@service/option-service"
import { IS_ANDROID } from "@util/constant/environment"
import { defaultAppearance } from "@util/constant/option"
import { toggle } from "@util/dark-mode"
import { ElColorPicker, ElMessageBox, ElOption, ElSelect, ElSlider, ElSwitch, ElTag, type TagProps } from "element-plus"
import { computed, defineComponent, type StyleValue } from "vue"
import { type OptionInstance } from "../../common"
import { useOption } from "../../useOption"
import OptionItem from '../OptionItem'
import OptionLines from '../OptionLines'
import OptionTag from '../OptionTag'
import DarkModeInput from "./DarkModeInput"

const SORTED_LOCALES: timer.Locale[] = ALL_LOCALES
    // Keep the locale same as this browser first position
    .sort((a, _b) => a === localeSameAsBrowser ? -1 : 0)
const allLocaleOptions: timer.option.LocaleOption[] = ["default", ...SORTED_LOCALES]

function copy(target: timer.option.AppearanceOption, source: timer.option.AppearanceOption) {
    target.displayWhitelistMenu = source.displayWhitelistMenu
    target.displayBadgeText = source.displayBadgeText
    target.badgeBgColor = source.badgeBgColor
    target.locale = source.locale
    target.printInConsole = source.printInConsole
    target.darkMode = source.darkMode
    target.darkModeTimeStart = source.darkModeTimeStart
    target.darkModeTimeEnd = source.darkModeTimeEnd
    target.chartAnimationDuration = source.chartAnimationDuration
}

const DEFAULT_ANIMA_DURATION = defaultAppearance().chartAnimationDuration
const DEFAULT_SIDE_PANEL_ENABLED = true
const FOLLOW_BROWSER: I18nKey = msg => msg.option.followBrowser

const _default = defineComponent((_props, ctx) => {
    const { option } = useOption<timer.option.AppearanceOption>({
        defaultValue: defaultAppearance, copy,
        onChange: async val => optionService.isDarkMode(val).then(toggle)
    })
    const { data: sidePanelEnabled, refresh: refreshSidePanel } = useRequest(isSidePanelEnabled, {
        defaultValue: DEFAULT_SIDE_PANEL_ENABLED,
    })
    const handleSidePanelChange = async (val: boolean) => {
        await setSidePanelEnabled(val)
        refreshSidePanel()
    }

    ctx.expose({
        reset() {
            handleSidePanelChange(DEFAULT_SIDE_PANEL_ENABLED)
            copy(option, defaultAppearance())
        }
    } satisfies OptionInstance)

    const handleLocaleChange = (newVal: timer.option.LocaleOption) => {
        option.locale = newVal
        // await maybe not work in Firefox, so calculate the real locale again
        // GG Firefox
        const realLocale: timer.Locale = newVal === "default"
            ? localeSameAsBrowser
            : newVal
        ElMessageBox({
            message: tWith(msg => msg.option.appearance.locale.changeConfirm, realLocale),
            type: "success",
            confirmButtonText: tWith(msg => msg.option.appearance.locale.reloadButton, realLocale),
            closeOnPressEscape: false,
            closeOnClickModal: false
        }).then(() => { location.reload?.() }).catch(() => {/* do nothing */ })
    }
    const animaDurationTagType = computed<TagProps['type']>(() => {
        const val = option.chartAnimationDuration
        if (!val) return 'info'
        if (val > DEFAULT_ANIMA_DURATION) return 'warning'
        return 'primary'
    })

    return () => (
        <OptionLines>
            <OptionItem label={msg => msg.option.appearance.darkMode.label} defaultValue={FOLLOW_BROWSER}>
                <DarkModeInput
                    modelValue={option.darkMode}
                    startSecond={option.darkModeTimeStart}
                    endSecond={option.darkModeTimeEnd}
                    onChange={async (darkMode, range) => {
                        option.darkMode = darkMode
                        option.darkModeTimeStart = range?.[0]
                        option.darkModeTimeEnd = range?.[1]
                    }}
                />
            </OptionItem>
            <OptionItem label={msg => msg.option.appearance.locale.label} defaultValue={FOLLOW_BROWSER}>
                <ElSelect
                    modelValue={option.locale}
                    size="small"
                    style={{ width: "120px" }}
                    onChange={(newVal: timer.option.LocaleOption) => handleLocaleChange(newVal)}
                    filterable
                >
                    {allLocaleOptions.map(locale => <ElOption
                        value={locale}
                        label={locale === "default" ? t(FOLLOW_BROWSER) : localeMessages[locale].name}
                    />)}
                </ElSelect>
            </OptionItem>
            {!IS_ANDROID && <>
                <OptionItem
                    label={msg => msg.option.appearance.displayWhitelist}
                    defaultValue={t(msg => msg.option.yes)}
                    v-slots={{
                        whitelist: () => <OptionTag>{t(msg => msg.option.appearance.whitelistItem)}</OptionTag>,
                        contextMenu: () => <OptionTag>{t(msg => msg.option.appearance.contextMenu)}</OptionTag>,
                    }}
                >
                    <ElSwitch
                        modelValue={option.displayWhitelistMenu}
                        onChange={val => option.displayWhitelistMenu = val as boolean}
                    />
                </OptionItem>
                <OptionItem
                    label={msg => msg.option.appearance.displayBadgeText}
                    defaultValue={t(msg => msg.option.yes)}
                    v-slots={{
                        timeInfo: () => <OptionTag>{t(msg => msg.option.appearance.badgeTextContent)}</OptionTag>,
                        icon: () => <OptionTag>{t(msg => msg.option.appearance.icon)}</OptionTag>,
                    }}
                >
                    <ElSwitch
                        modelValue={option.displayBadgeText}
                        onChange={val => option.displayBadgeText = val as boolean}
                    />
                </OptionItem>
                <OptionItem
                    v-show={option.displayBadgeText}
                    label={msg => msg.option.appearance.badgeBgColor}
                >
                    <ElColorPicker
                        size="small"
                        modelValue={option.badgeBgColor}
                        onChange={val => option.badgeBgColor = val ?? undefined}
                    />
                </OptionItem>
                <OptionItem
                    label={msg => msg.option.appearance.printInConsole.label}
                    defaultValue={t(msg => msg.option.yes)}
                    v-slots={{
                        console: () => <OptionTag>{t(msg => msg.option.appearance.printInConsole.console)}</OptionTag>,
                        info: () => <OptionTag>{t(msg => msg.option.appearance.printInConsole.info)}</OptionTag>,
                    }}
                >
                    <ElSwitch
                        modelValue={option.printInConsole}
                        onChange={val => option.printInConsole = val as boolean}
                    />
                </OptionItem>
            </>}
            {SIDE_PANEL_STATE_SUPPORTED_CONTROL && (
                <OptionItem
                    label={msg => msg.option.appearance.sidePanel}
                    defaultValue={DEFAULT_SIDE_PANEL_ENABLED}
                >
                    <ElSwitch
                        modelValue={sidePanelEnabled.value}
                        onChange={v => handleSidePanelChange(!!v)}
                    />
                </OptionItem>
            )}
            <OptionItem
                label={msg => msg.option.appearance.animationDuration}
                defaultValue={`${DEFAULT_ANIMA_DURATION}ms`}
            >
                <ElSlider
                    modelValue={option.chartAnimationDuration}
                    showStops step={100}
                    min={0} max={1500}
                    size="small"
                    persistent={false}
                    style={{ width: '250px', display: 'inline-flex', marginInlineStart: '10px' } satisfies StyleValue}
                    formatTooltip={val => `${val}ms`}
                    onUpdate:modelValue={val => option.chartAnimationDuration = Array.isArray(val) ? val[0] : val}
                />
                <ElTag
                    size="small"
                    type={animaDurationTagType.value}
                    style={{ marginInlineStart: '12px' } satisfies StyleValue}
                >
                    {option.chartAnimationDuration}ms
                </ElTag>
            </OptionItem>
        </OptionLines>
    )
})

export default _default