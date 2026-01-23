/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useCategory } from "@app/context"
import { t } from "@app/locale"
import { useRequest } from "@hooks"
import Flex from "@pages/components/Flex"
import { getSite } from '@service/site-service'
import { CATE_NOT_SET_ID } from '@util/site'
import { ElTag } from "element-plus"
import { computed, defineComponent, type StyleValue, toRef } from "vue"
import { useAnalysisTarget } from "../../context"
import { labelOfHostInfo } from "../../util"

const TITLE_STYLE: StyleValue = {
    fontSize: '26px',
    marginBlockStart: '.2em',
    marginBlockEnd: '.4em',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
}

const SUBTITLE_STYLE: StyleValue = {
    fontSize: '14px',
    color: 'var(--el-text-color-secondary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    margin: 0,
}

const SiteInfo = defineComponent<{ value: timer.site.SiteKey }>(props => {
    const key = toRef(props, 'value')
    const { data: site } = useRequest(() => key.value ? getSite(key.value) : undefined, { deps: key })
    const iconUrl = computed(() => site.value?.iconUrl)
    const title = computed(() => site.value?.alias ?? labelOfHostInfo(site.value))
    const subtitle = computed(() => site.value?.alias ? labelOfHostInfo(site.value) : undefined)

    return () => (
        <Flex width="100%" column align="center">
            <img v-show={!!iconUrl.value} src={iconUrl.value} width={24} height={24} />
            <h1 style={TITLE_STYLE}>{title.value}</h1>
            {subtitle && <p style={SUBTITLE_STYLE}>{subtitle.value}</p>}
        </Flex>
    )
}, { props: ['value'] })

const CateInfo = defineComponent<{ value: number }>(props => {
    const { all } = useCategory()
    const cateName = computed(() => {
        const cateId = props.value
        return cateId === CATE_NOT_SET_ID
            ? t(msg => msg.shared.cate.notSet)
            : all.find(c => c.id === cateId)?.name ?? ''
    })

    return () => (
        <Flex width="100%" gap={5} column align="center">
            <h1 style={TITLE_STYLE}>{cateName.value}</h1>
            <ElTag type='info' size="small">{t(msg => msg.analysis.target.cate)}</ElTag>
        </Flex>
    )
}, { props: ['value'] })

const TargetInfo = defineComponent(() => {
    const target = useAnalysisTarget()
    return () => (
        <Flex
            align="center"
            justify="center"
            minHeight={140}
            boxSizing="border-box"
            padding="0 25px"
        >
            {!target.value && <h1 style={TITLE_STYLE}>{t(msg => msg.analysis.common.emptyDesc)}</h1>}
            {target.value?.type === 'site' && <SiteInfo value={target.value?.key} />}
            {target.value?.type === 'cate' && <CateInfo value={target.value?.key} />}
        </Flex>
    )
})

export default TargetInfo
