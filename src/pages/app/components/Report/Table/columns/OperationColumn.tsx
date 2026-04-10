/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { addWhitelist, listWhitelist, removeWhitelist } from "@api/sw/whitelist"
import { AnalysisQuery } from '@app/components/Analysis/context'
import PopupConfirmButton from '@app/components/common/PopupConfirmButton'
import { computeDeleteConfirmMsg, handleDelete } from '@app/components/Report/common'
import { useReportFilter } from '@app/components/Report/context'
import { t } from '@app/locale'
import { ANALYSIS_ROUTE } from '@app/router/constants'
import { Delete, Open, Plus, Stopwatch } from "@element-plus/icons-vue"
import { useManualRequest, useRequest, useTabGroups } from '@hooks'
import { locale } from "@i18n"
import { CATE_NOT_SET_ID } from "@util/site"
import { isCate, isGroup, isNormalSite, isSite } from "@util/stat"
import { ElButton, ElMessage, ElTableColumn, type RenderRowData } from "element-plus"
import { computed, defineComponent } from "vue"
import { useRouter } from "vue-router"

const LOCALE_WIDTH: { [locale in timer.Locale]: number } = {
    en: 330,
    zh_CN: 290,
    ja: 360,
    zh_TW: 290,
    pt_PT: 340,
    uk: 400,
    es: 360,
    de: 370,
    fr: 330,
    ru: 350,
    ar: 320,
    tr: 320,
    pl: 320,
    it: 320,
}

type Props = {
    onDelete?: ArgCallback<timer.stat.Row>
}

const analysisVisible = (row: timer.stat.Row) => {
    if (isGroup(row)) return false
    if (isCate(row)) return row.cateKey !== CATE_NOT_SET_ID
    return true
}

const deleteVisible = (row: timer.stat.Row) => {
    if (isCate(row)) return false
    if (isSite(row) && row.siteKey.type === 'merged') return false
    return true
}

const _default = defineComponent<Props>(({ onDelete }) => {
    const filter = useReportFilter()
    const { groupMap } = useTabGroups()
    const width = computed(() => {
        const siteMerge = filter.siteMerge
        return !siteMerge || siteMerge === 'group' ? LOCALE_WIDTH[locale] : 110
    })
    const router = useRouter()
    const { data: whitelist, refresh: refreshWhitelist } = useRequest(listWhitelist, { defaultValue: [] })
    const onWhitelistSuccess = () => {
        refreshWhitelist()
        ElMessage.success(t(msg => msg.operation.successMsg))
    }
    const { refresh: onAddWhitelist } = useManualRequest(addWhitelist, { onSuccess: onWhitelistSuccess })
    const { refresh: onRemoveWhitelist } = useManualRequest(removeWhitelist, { onSuccess: onWhitelistSuccess })

    const jump2Analysis = (row: timer.stat.Row) => {
        let query: AnalysisQuery
        if (isCate(row)) {
            query = { cateId: row.cateKey?.toString?.() }
        } else if (isSite(row)) {
            query = { ...row.siteKey }
        } else {
            return
        }
        router.push({ path: ANALYSIS_ROUTE, query })
    }

    return () => (
        <ElTableColumn
            width={width.value}
            label={t(msg => msg.button.operation)}
            align="center"
        >
            {({ row }: RenderRowData<timer.stat.Row>) => <>
                {/* Analysis */}
                {analysisVisible(row) && (
                    <ElButton
                        icon={Stopwatch}
                        size="small"
                        type="primary"
                        onClick={() => jump2Analysis(row)}
                    >
                        {t(msg => msg.item.operation.analysis)}
                    </ElButton>
                )}
                {/* Delete button */}
                {deleteVisible(row) && (
                    <PopupConfirmButton
                        buttonIcon={Delete}
                        buttonType="danger"
                        buttonText={t(msg => msg.button.delete)}
                        confirmText={computeDeleteConfirmMsg(row, filter, groupMap.value)}
                        onConfirm={async () => {
                            await handleDelete(row, filter)
                            onDelete?.(row)
                        }}
                    />
                )}
                {/* Add 2 whitelist */}
                {isNormalSite(row) && !whitelist.value.includes(row.siteKey.host) && (
                    <PopupConfirmButton
                        buttonIcon={Plus}
                        buttonType="warning"
                        buttonText={t(msg => msg.item.operation.add2Whitelist)}
                        confirmText={t(msg => msg.whitelist.addConfirmMsg, { url: row.siteKey?.host })}
                        onConfirm={() => onAddWhitelist(row.siteKey.host)}
                    />
                )}
                {/* Remove from whitelist */}
                {isNormalSite(row) && whitelist.value.includes(row.siteKey.host) && (
                    <PopupConfirmButton
                        buttonIcon={Open}
                        buttonType="primary"
                        buttonText={t(msg => msg.button.enable)}
                        confirmText={t(msg => msg.whitelist.removeConfirmMsg, { url: row.siteKey?.host })}
                        onConfirm={() => onRemoveWhitelist(row.siteKey.host)}
                    />
                )}
            </>}
        </ElTableColumn>
    )
}, { props: ['onDelete'] })

export default _default
