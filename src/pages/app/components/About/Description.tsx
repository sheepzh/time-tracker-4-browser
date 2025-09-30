import { t } from "@app/locale"
import { MediaSize, useMediaSize } from "@hooks"
import { locale } from "@i18n"
import Flex from "@pages/components/Flex"
import metaService from "@service/meta-service"
import packageInfo, { AUTHOR_EMAIL } from "@src/package"
import {
    CHANGE_LOG_PAGE,
    CHROME_HOMEPAGE, EDGE_HOMEPAGE,
    FEEDBACK_QUESTIONNAIRE,
    FIREFOX_HOMEPAGE,
    getHomepageWithLocale,
    GITHUB_ISSUE_ADD,
    HOMEPAGE,
    LICENSE_PAGE, PRIVACY_PAGE,
    REVIEW_PAGE,
    SOURCE_CODE_PAGE,
} from "@util/constant/url"
import { type ComponentSize, ElCard, ElDescriptions, ElDescriptionsItem, ElDivider, ElText } from "element-plus"
import { computed, defineComponent } from "vue"
import DescLink from "./DescLink"
import "./description.sass"
import InstallationLink from "./InstallationLink"

const computeSize = (mediaSize: MediaSize): ComponentSize => {
    if (mediaSize <= MediaSize.sm) {
        return 'small'
    } else if (mediaSize === MediaSize.md) {
        return 'default'
    } else {
        return 'large'
    }
}

const _default = defineComponent(() => {
    const feedbackUrl = FEEDBACK_QUESTIONNAIRE[locale] || GITHUB_ISSUE_ADD
    const mediaSize = useMediaSize()
    const column = computed(() => mediaSize.value <= MediaSize.md ? 1 : 2)
    const isXs = computed(() => mediaSize.value === MediaSize.xs)
    const size = computed(() => computeSize(mediaSize.value))

    return () => (
        <ElCard class="about-card">
            <ElDescriptions
                size={size.value}
                column={column.value}
                border
            >
                <ElDescriptionsItem label={t(msg => msg.about.label.name)} labelAlign="right">
                    {t(msg => msg.meta.marketName)}
                </ElDescriptionsItem>
                <ElDescriptionsItem label={t(msg => msg.about.label.version)} labelAlign="right">
                    v{packageInfo.version}
                </ElDescriptionsItem>
                <ElDescriptionsItem label={t(msg => msg.about.label.website)} labelAlign="right">
                    <DescLink href={getHomepageWithLocale()}>
                        {HOMEPAGE}
                    </DescLink>
                </ElDescriptionsItem>
                <ElDescriptionsItem label={t(msg => msg.about.label.privacy)} labelAlign="right">
                    <DescLink href={PRIVACY_PAGE}>
                        {PRIVACY_PAGE}
                    </DescLink>
                </ElDescriptionsItem>
                <ElDescriptionsItem label={t(msg => msg.base.sourceCode)} labelAlign="right">
                    <DescLink href={SOURCE_CODE_PAGE} icon="github">
                        {SOURCE_CODE_PAGE}
                    </DescLink>
                </ElDescriptionsItem>
                <ElDescriptionsItem label={t(msg => msg.about.label.license)} labelAlign="right">
                    <DescLink href={LICENSE_PAGE}>
                        MIT License
                    </DescLink>
                </ElDescriptionsItem>
                <ElDescriptionsItem label={t(msg => msg.base.changeLog)} labelAlign="right">
                    <DescLink href={CHANGE_LOG_PAGE} icon="github">
                        {CHANGE_LOG_PAGE}
                    </DescLink>
                </ElDescriptionsItem>
                <ElDescriptionsItem label={t(msg => msg.about.label.support)} labelAlign="right">
                    {AUTHOR_EMAIL}
                </ElDescriptionsItem>
                <ElDescriptionsItem label={t(msg => msg.about.label.installation)} labelAlign="right">
                    <Flex gap={15} align="center" margin={mediaSize.value === MediaSize.xs ? '5px 0' : 10}>
                        <InstallationLink href={CHROME_HOMEPAGE} name="Chrome" source="chrome" />
                        <InstallationLink href={EDGE_HOMEPAGE} name="Edge" source="edge" />
                        <InstallationLink href={FIREFOX_HOMEPAGE} name="Firefox" source="firefox" />
                        <InstallationLink href="https://kiwibrowser.com/" name="Kiwi" source="kiwi" />
                    </Flex>
                </ElDescriptionsItem>
                <ElDescriptionsItem label={t(msg => msg.about.label.thanks)} labelAlign="right">
                    <div>
                        <DescLink href="https://vuejs.org/" icon="vue">VueJS</DescLink>
                    </div>
                    <div>
                        <DescLink href="https://echarts.apache.org/" icon="echarts">Echarts</DescLink>
                    </div>
                    <div>
                        <DescLink href="https://element-plus.org/" icon="element-plus">Element Plus</DescLink>
                    </div>
                </ElDescriptionsItem>
            </ElDescriptions>
            <ElDivider />
            <div class="text-container">
                <div>
                    <ElText size="large">
                        🌟&ensp;
                        {t(msg => msg.about.text.greet)}&ensp;
                        <a href={REVIEW_PAGE || CHROME_HOMEPAGE} target="_blank" onClick={() => metaService.saveFlag("rateOpen")}>
                            {t(msg => msg.about.text.rate)}
                        </a>
                    </ElText>
                </div>
                <div>
                    <ElText size="large">
                        🙋&ensp;
                        <a href={feedbackUrl} target="_blank">
                            {t(msg => msg.about.text.feedback)}
                        </a>
                    </ElText>
                </div>
            </div>
        </ElCard>
    )
})

export default _default