/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { computeDeleteConfirmMsg, handleDelete } from '@app/components/Record/common'
import { useRecordFilter } from '@app/components/Record/context'
import { t } from '@app/locale'
import { SITE_ANALYSIS_ROUTE, type SiteAnalysisQuery } from '@app/router/constants'
import { Delete, Stopwatch } from "@element-plus/icons-vue"
import { useTabGroups } from '@hooks'
import { locale } from "@i18n"
import ConfirmButton from '@pages/components/ConfirmButton'
import { CATE_NOT_SET_ID } from "@util/site"
import { isCate, isGroup, isSite } from "@util/stat"
import { ElButton, ElTableColumn, type RenderRowData } from "element-plus"
import { computed, defineComponent } from "vue"
import { useRouter } from "vue-router"

const LOCALE_WIDTH: { [locale in tt4b.Locale]: number } = {
    en: 180,
    zh_CN: 150,
    ja: 150,
    zh_TW: 150,
    pt_PT: 180,
    uk: 180,
    es: 180,
    de: 180,
    fr: 190,
    ru: 180,
    ar: 150,
    tr: 160,
    pl: 160,
    it: 180,
}

type Props = {
    onDelete?: ArgCallback<tt4b.stat.Row>
}

const analysisVisible = (row: tt4b.stat.Row) => {
    if (isGroup(row)) return false
    if (isCate(row)) return row.cateKey !== CATE_NOT_SET_ID
    return true
}

const deleteVisible = (row: tt4b.stat.Row) => {
    if (isCate(row)) return false
    if (isSite(row) && row.siteKey.type === 'merged') return false
    return true
}

const _default = defineComponent<Props>(({ onDelete }) => {
    const filter = useRecordFilter()
    const { groupMap } = useTabGroups()
    const width = computed(() => {
        const siteMerge = filter.siteMerge
        return !siteMerge || siteMerge === 'group' ? LOCALE_WIDTH[locale] : 110
    })
    const router = useRouter()

    const jump2Analysis = (row: tt4b.stat.Row) => {
        let query: SiteAnalysisQuery
        if (isCate(row)) {
            query = { cateId: row.cateKey?.toString?.() }
        } else if (isSite(row)) {
            query = { ...row.siteKey }
        } else {
            return
        }
        router.push({ path: SITE_ANALYSIS_ROUTE, query })
    }

    return () => (
        <ElTableColumn
            width={width.value}
            label={t(msg => msg.button.operation)}
            align="center"
            fixed='right'
        >
            {({ row }: RenderRowData<tt4b.stat.Row>) => <>
                {/* Analysis */}
                {analysisVisible(row) && (
                    <ElButton
                        icon={Stopwatch}
                        size="small"
                        link type="primary"
                        onClick={() => jump2Analysis(row)}
                    >
                        {t(msg => msg.item.operation.analysis)}
                    </ElButton>
                )}
                {/* Delete button */}
                {deleteVisible(row) && (
                    <ConfirmButton
                        buttonProps={{ icon: Delete, type: 'danger', size: 'small', link: true }}
                        buttonText={t(msg => msg.button.delete)}
                        confirmText={computeDeleteConfirmMsg(row, filter, groupMap.value)}
                        onConfirm={async () => {
                            await handleDelete(row, filter)
                            onDelete?.(row)
                        }}
                    />
                )}
            </>}
        </ElTableColumn>
    )
}, { props: ['onDelete'] })

export default _default
