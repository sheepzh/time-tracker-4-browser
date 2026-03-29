/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useRequest } from '@hooks'
import { t } from '@app/locale'
import Flex from "@pages/components/Flex"
import { getTranslationStatus, type TranslationStatusInfo } from "@api/crowdin"
import localeMessages from "@i18n/message/locale"
import { ElProgress, type ProgressProps } from "element-plus"
import { defineComponent, ref, type StyleValue } from "vue"

type SupportedLocale = timer.Locale | timer.TranslatingLocale

const localeCrowdMap: { [locale in SupportedLocale]: string } = {
    en: "en",
    zh_CN: "zh-CN",
    ja: "ja",
    zh_TW: "zh-TW",
    de: "de",
    es: "es-ES",
    ko: "ko",
    pl: "pl",
    pt_PT: "pt-PT",
    ru: "ru",
    uk: "uk",
    fr: "fr",
    it: "it",
    sv: "sv-SE",
    fi: "fi",
    da: "da",
    hr: "hr",
    id: "id",
    tr: "tr",
    cs: "cs",
    ro: "ro",
    nl: "nl",
    vi: "vi",
    sk: "sk",
    mn: "mn",
    ar: "ar",
    hi: "hi",
}

const crowdLocaleMap: { [locale: string]: SupportedLocale } = {}

Object.entries(localeCrowdMap).forEach(([locale, crowdLang]) => crowdLocaleMap[crowdLang] = locale as SupportedLocale)

type ProgressInfo = {
    locale: SupportedLocale | string
    progress: number
}

const convert2Info = ({ languageId, translationProgress }: TranslationStatusInfo): ProgressInfo => ({
    locale: crowdLocaleMap[languageId] || languageId,
    progress: translationProgress
} satisfies ProgressInfo)

const compareLocale = ({ progress: pa, locale: la }: ProgressInfo, { progress: pb, locale: lb }: ProgressInfo): number => {
    const progressDiff = (pb ?? 0) - (pa ?? 0)
    return progressDiff || la?.localeCompare?.(lb) || 0
}

function computeType(progress: number): ProgressProps["status"] {
    if (progress >= 95) {
        return "success"
    } else if (progress >= 50) {
        return ""
    } else {
        return "warning"
    }
}

const CONTAINER_STYLE: StyleValue = {
    display: 'grid',
    paddingInline: '30px',
    boxSizing: 'border-box',
    width: '100%',
    minHeight: '200px',
    gridTemplateColumns: 'repeat(3, 30%)',
    columnGap: '5%',
    rowGap: '30px',
    marginBottom: '40px',
}

async function queryData(): Promise<ProgressInfo[]> {
    const langList = await getTranslationStatus()
    return langList?.map?.(convert2Info)?.sort(compareLocale)
}

const _default = defineComponent(() => {
    const container = ref<HTMLDivElement>()
    const { data: list } = useRequest(
        queryData,
        { loadingTarget: container, loadingText: t(msg => msg.helpUs.loading) },
    )
    return () => (
        <div ref={container} style={CONTAINER_STYLE}>
            {list.value?.map?.(({ locale, progress }) => (
                <ElProgress
                    percentage={progress}
                    strokeWidth={22}
                    status={computeType(progress)}
                    style={{ fontSize: '16px' } satisfies StyleValue}
                >
                    <Flex width={70} gap={10} fontSize={12} column align="end" color="var(--el-text-color-regular)">
                        <span>{`${progress}%`}</span>
                        <span>{localeMessages[locale as timer.Locale]?.name ?? locale}</span>
                    </Flex>
                </ElProgress>
            ))}
        </div>
    )
})

export default _default