import { t } from "@app/locale"
import { css } from '@emotion/css'
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
import { type ComponentSize, ElCard, ElDescriptions, ElDescriptionsItem, ElDivider, ElText, useNamespace } from "element-plus"
import { computed, defineComponent, reactive } from "vue"
import DescLink from "./DescLink"
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

const useTextContainerClz = () => {
    const textNs = useNamespace('text')
    return css`
        padding: 20px 40px;
        display: flex;
        flex-direction: row;
        & > div {
            flex: 1;
            text-align: center;
            padding: 0 40px;
            line-height: 1.75rem;
        }
        & .${textNs.b()} a {
            color: unset;
            font-size: inherit;
            line-height: inherit;
        }
        & .${textNs.b()} a:visited {
            color: unset;
        }
        html[data-media-size='xs'] & {
            flex-direction: column;
            padding-inline: 0;
            gap: 40px;
            > div {
                padding: 0;
            }
        }
    `
}
const useDescriptionsClz = () => {
    const ns = useNamespace('descriptions')
    return css`
        html[data-media-size='xs'] & {
            .${ns.e('table')} {
                table-layout: fixed;
            }
            .${ns.e('label')} {
                width: 28%;
                min-width: 100px;
            }
            .${ns.e('content')} {
                word-break: break-all;
            }
        }
    `
}

const _default = defineComponent<{}>(() => {
    const feedbackUrl = FEEDBACK_QUESTIONNAIRE[locale] || GITHUB_ISSUE_ADD
    const mediaSize = useMediaSize()
    const column = computed(() => mediaSize.value <= MediaSize.md ? 1 : 2)
    const size = computed(() => computeSize(mediaSize.value))
    const pages = reactive({
        homepage: HOMEPAGE,
        privacy: PRIVACY_PAGE,
        sourceCode: SOURCE_CODE_PAGE,
        changeLog: CHANGE_LOG_PAGE,
        email: AUTHOR_EMAIL,
    })
    const textContainerClz = useTextContainerClz()
    const descClz = useDescriptionsClz()

    return () => (
        <ElCard>
            <ElDescriptions size={size.value} column={column.value} border class={descClz}>
                <ElDescriptionsItem label={t(msg => msg.about.label.name)} labelAlign="right">
                    {t(msg => msg.meta.marketName)}
                </ElDescriptionsItem>
                <ElDescriptionsItem label={t(msg => msg.about.label.version)} labelAlign="right">
                    v{packageInfo.version}
                </ElDescriptionsItem>
                <ElDescriptionsItem label={t(msg => msg.about.label.website)} labelAlign="right">
                    <DescLink href={getHomepageWithLocale()}>
                        {pages.homepage}
                    </DescLink>
                </ElDescriptionsItem>
                <ElDescriptionsItem label={t(msg => msg.about.label.privacy)} labelAlign="right">
                    <DescLink href={pages.privacy} />
                </ElDescriptionsItem>
                <ElDescriptionsItem label={t(msg => msg.base.sourceCode)} labelAlign="right">
                    <DescLink href={pages.sourceCode} icon="Github" />
                </ElDescriptionsItem>
                <ElDescriptionsItem label={t(msg => msg.about.label.license)} labelAlign="right">
                    <DescLink href={LICENSE_PAGE}>
                        MIT License
                    </DescLink>
                </ElDescriptionsItem>
                <ElDescriptionsItem label={t(msg => msg.base.changeLog)} labelAlign="right">
                    <DescLink href={pages.changeLog} icon="Github" />
                </ElDescriptionsItem>
                <ElDescriptionsItem label={t(msg => msg.about.label.support)} labelAlign="right">
                    {pages.email}
                </ElDescriptionsItem>
                <ElDescriptionsItem label={t(msg => msg.about.label.installation)} labelAlign="right">
                    <Flex gap={15} align="center" margin={mediaSize.value === MediaSize.xs ? '5px 0' : 10}>
                        <InstallationLink href={CHROME_HOMEPAGE} name="Chrome" source="Chrome" />
                        <InstallationLink href={EDGE_HOMEPAGE} name="Edge" source="Edge" />
                        <InstallationLink href={FIREFOX_HOMEPAGE} name="Firefox" source="Firefox" />
                    </Flex>
                </ElDescriptionsItem>
                <ElDescriptionsItem label={t(msg => msg.about.label.thanks)} labelAlign="right">
                    <div>
                        <DescLink href="https://vuejs.org/" icon="Vue">VueJS</DescLink>
                    </div>
                    <div>
                        <DescLink href="https://echarts.apache.org/" icon="Echarts">Echarts</DescLink>
                    </div>
                    <div>
                        <DescLink href="https://element-plus.org/" icon="ElementPlus">Element Plus</DescLink>
                    </div>
                </ElDescriptionsItem>
            </ElDescriptions>
            <ElDivider />
            <div class={textContainerClz}>
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