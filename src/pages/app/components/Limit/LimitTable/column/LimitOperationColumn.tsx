/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { t } from "@app/locale"
import { Delete, Edit } from "@element-plus/icons-vue"
import { locale } from "@i18n"
import { ElButton, ElTableColumn, type RenderRowData } from "element-plus"
import { defineComponent } from "vue"
import { verifyCanModify } from "../../common"
import { useLimitAction, useLimitTable } from "../../context"

const LOCALE_WIDTH: { [locale in timer.Locale]: number } = {
    en: 220,
    zh_CN: 200,
    ja: 200,
    zh_TW: 200,
    pt_PT: 250,
    uk: 260,
    es: 240,
    de: 250,
    fr: 230,
    ru: 240,
    ar: 220,
}

const _default = defineComponent<{}>(() => {
    const { deleteRow } = useLimitTable()
    const { modify } = useLimitAction()

    const handleModify = (row: timer.limit.Item) => verifyCanModify(row)
        .then(() => modify(row))
        .catch(() => {/** Do nothing */ })

    return () => <ElTableColumn
        prop="operations"
        label={t(msg => msg.button.operation)}
        width={LOCALE_WIDTH[locale]}
        align="center"
        fixed="right"
        v-slots={({ row }: RenderRowData<timer.limit.Item>) => <>
            <ElButton type="danger" size="small" icon={Delete} onClick={() => deleteRow(row)}>
                {t(msg => msg.button.delete)}
            </ElButton>
            <ElButton type="primary" size="small" icon={Edit} onClick={() => handleModify(row)}>
                {t(msg => msg.button.modify)}
            </ElButton>
        </>}
    />
})

export default _default
