/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import { MediaSize, useManualRequest, useMediaSize, useRequest, useXsState } from "@hooks"
import { isTranslatingLocale, locale } from "@i18n"
import Flex from "@pages/components/Flex"
import { recommendRate, saveFlag } from "@service/meta-service"
import { REVIEW_PAGE } from "@util/constant/url"
import { ElRow, ElScrollbar } from "element-plus"
import { computed, defineComponent, type FunctionalComponent } from "vue"
import { useRouter } from "vue-router"
import ContentContainer from "../common/ContentContainer"
import Calendar from "./components/Calendar"
import Indicator from "./components/Indicator"
import MonthOnMonth from "./components/MonthOnMonth"
import Timeline from './components/Timeline'
import TopKVisit from "./components/TopKVisit"
import DashboardCard, { type DashboardCardProps } from './DashboardCard'

const ROW_GUTTER = 15

const Link: FunctionalComponent<{ onClick?: NoArgCallback }> = ({ onClick }, ctx) => (
    <Flex
        width="100%"
        cursor="pointer"
        color="text-primary"
        justify="center"
        align="center"
        fontSize={14}
        onClick={onClick}
        v-slots={ctx.slots}
    />
)

const _default = defineComponent(() => {
    const router = useRouter()
    const jump2Help = () => router.push({ path: "/other/help" })
    const isNotEnOrZhCn = locale !== "en" && locale !== "zh_CN"
    const showHelp = isTranslatingLocale() || isNotEnOrZhCn
    const { data: showRate, refresh } = useRequest(recommendRate)
    const { refresh: handleRate } = useManualRequest(() => saveFlag("rateOpen"), { onSuccess: refresh })

    const mediaSize = useMediaSize()
    const isXs = useXsState()

    const indicatorCardProps = computed<DashboardCardProps>(() => isXs.value ? {
        span: 24,
        height: 'fit-content',
        bodyHeight: 'fit-content',
    } : { span: 8 })

    return () => (
        <ElScrollbar>
            <ContentContainer class="dashboard-container">
                <ElRow gutter={ROW_GUTTER}>
                    {mediaSize.value <= MediaSize.md
                        ? <>
                            <DashboardCard {...indicatorCardProps.value}>
                                <Indicator />
                            </DashboardCard>
                            <DashboardCard span={isXs.value ? 24 : 16}>
                                <TopKVisit />
                            </DashboardCard>
                            <DashboardCard span={24}>
                                <MonthOnMonth />
                            </DashboardCard>
                        </>
                        : <>
                            <DashboardCard span={4}>
                                <Indicator />
                            </DashboardCard>
                            <DashboardCard span={12}>
                                <MonthOnMonth />
                            </DashboardCard>
                            <DashboardCard span={8}>
                                <TopKVisit />
                            </DashboardCard>
                        </>}
                    {mediaSize.value >= MediaSize.lg && <>
                        <DashboardCard span={24} height={290}>
                            <Calendar />
                        </DashboardCard>
                        <Timeline height={260} />
                    </>}
                </ElRow>
                <Flex v-show={showHelp || showRate.value}>
                    {showRate.value ? (
                        <Link>
                            🌟 {t(msg => msg.about.text.greet)}&ensp;
                            <a
                                href={REVIEW_PAGE}
                                target="_blank"
                                onClick={handleRate}
                                style={{ color: 'inherit' }}
                            >
                                {t(msg => msg.about.text.rate)}
                            </a>
                        </Link>
                    ) : (
                        <Link onClick={jump2Help}>
                            💡 Help us translate this extension/addon into your native language!
                        </Link>
                    )}
                </Flex>
            </ContentContainer>
        </ElScrollbar>
    )
})

export default _default