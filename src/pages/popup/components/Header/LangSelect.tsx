import { createTab } from "@api/chrome/tab"
import { useManualRequest } from "@hooks/useManualRequest"
import { useRequest } from "@hooks/useRequest"
import { ALL_LOCALES, handleLocaleOption, localeSameAsBrowser, t } from "@i18n"
import optionMessages from "@i18n/message/app/option"
import localeMessages from "@i18n/message/common/locale"
import Flex from "@pages/components/Flex"
import { usePopupContext } from "@popup/context"
import { t as tPopup } from "@popup/locale"
import optionHolder from "@service/components/option-holder"
import optionService from "@service/option-service"
import { CROWDIN_HOMEPAGE } from "@util/constant/url"
import { ElDropdown, ElDropdownItem, ElDropdownMenu, ElIcon, ElText } from "element-plus"
import { defineComponent, type StyleValue } from "vue"

// Keep the locale same as this browser first position
const SORTED_LOCALES: timer.Locale[] = ALL_LOCALES.sort((a, _b) => a === localeSameAsBrowser ? -1 : 0)

const SELECTED_STYLES: StyleValue = {
    color: 'var(--el-color-primary)',
    fontWeight: 'bold'
}

const LangSelect = defineComponent(() => {
    const { data: current } = useRequest(async () => {
        const option = await optionHolder.get()
        return option?.locale
    })

    const { reload: reloadPopup } = usePopupContext()

    const { refresh: saveLocale } = useManualRequest(
        async opt => {
            await optionService.setLocale(opt)
            handleLocaleOption(opt)
        },
        { onSuccess: reloadPopup },
    )

    return () => (
        <ElDropdown
            size="small"
            trigger="click"
            style={{ cursor: 'pointer' }}
            v-slots={{
                default: () => (
                    <Flex align="center" gap={2}>
                        <ElIcon size="large" color="var(--el-text-color-primary)">
                            <svg viewBox="0 0 1024 1024">
                                <path
                                    d="M696 716c-26.834 0-46-19.166-46-46v-92c0-26.834-19.166-46-46-46H374c-26.834 0-46-19.166-46-46s19.166-46 46-46h46c26.834 0 46-19.166 46-46v-34.5c0-30.666 26.834-57.5 57.5-57.5H558c49.834 0 92-42.166 92-92v-19.166C784.166 244.5 880 378.666 880 532c0 95.834-38.334 184-95.834 249.166C768.834 742.834 738.166 716 696 716z m-230 180.166C285.834 873.166 144 716 144 532c0-26.834 3.834-53.666 7.666-84.334L362.5 658.5c3.834 3.834 7.666 11.5 7.666 19.166v34.5c3.834 49.834 26.834 80.5 69 88.168 11.5 3.832 23 15.332 23 26.832 3.834 7.668 3.834 69 3.834 69zM52 532c0 253 207 460 460 460s460-207 460-460S765 72 512 72 52 279 52 532z"
                                />
                            </svg>
                        </ElIcon>
                        {!!current.value && (
                            <ElText size="small">
                                {current.value === 'default' ? 'SYS' : current.value.substring(0, 2).toUpperCase()}
                            </ElText>
                        )}
                    </Flex>
                ),
                dropdown: () => (
                    <ElDropdownMenu>
                        {SORTED_LOCALES.map(locale => (
                            <ElDropdownItem
                                onClick={() => saveLocale(locale)}
                                style={locale === current.value ? SELECTED_STYLES : null}
                            >
                                {localeMessages?.[locale]?.name ?? locale}
                            </ElDropdownItem>
                        ))}
                        <ElDropdownItem
                            onClick={() => saveLocale('default')}
                            style={current.value === 'default' ? SELECTED_STYLES : null}
                        >
                            {t(optionMessages, { key: m => m.followBrowser })}
                        </ElDropdownItem>
                        <ElDropdownItem
                            onClick={() => createTab(CROWDIN_HOMEPAGE)}
                            divided
                        >
                            {tPopup(msg => msg.menu.helpUs)}
                        </ElDropdownItem>
                    </ElDropdownMenu>
                )
            }}
        />
    )
})

export default LangSelect