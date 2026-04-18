/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { changeSiteAlias, fillInitialAlias, getInitialAlias } from "@api/sw/site"
import Editable from "@app/components/common/Editable"
import { useSiteManageTable } from '@app/components/SiteManage/useSiteManage'
import { t } from '@app/locale'
import { MagicStick } from "@element-plus/icons-vue"
import { useManualRequest } from '@hooks'
import Flex from "@pages/components/Flex"
import { identifySiteKey } from "@util/site"
import { ElIcon, ElMessage, ElPopconfirm, ElTableColumn, ElText } from "element-plus"
import { defineComponent, type StyleValue } from "vue"

const AliasColumn = defineComponent<{}>(() => {
    const { pagination, refresh } = useSiteManageTable()
    const { refresh: doChange } = useManualRequest(changeSiteAlias, { onSuccess: refresh })

    const handleBatchGenerate = async () => {
        let { list } = pagination.value
        if (!list.length) return ElMessage.info("No data")
        await fillInitialAlias(list)
        refresh()
        ElMessage.success(t(msg => msg.operation.successMsg))
    }

    const genInitialAlias = async ({ host, type, alias }: timer.site.SiteInfo) => {
        if (alias) return alias
        if (type === 'normal') return await getInitialAlias(host)
        return undefined
    }

    return () => (
        <ElTableColumn
            minWidth={160}
            align="center"
            v-slots={{
                header: () => (
                    <Flex justify="center" align="center" gap={4}>
                        <span>{t(msg => msg.siteManage.column.alias)}</span>
                        <ElPopconfirm
                            title={t(msg => msg.siteManage.genAliasConfirmMsg)}
                            width={400}
                            onConfirm={handleBatchGenerate}
                            v-slots={{
                                reference: () => (
                                    <Flex height='100%'>
                                        <ElText type="primary" style={{ cursor: 'pointer' } satisfies StyleValue}>
                                            <ElIcon color="primary">
                                                <MagicStick />
                                            </ElIcon>
                                        </ElText>
                                    </Flex>
                                )
                            }}
                        />
                    </Flex>
                ),
                default: ({ row }: { row: timer.site.SiteInfo }) => (
                    <Editable
                        key={`${identifySiteKey(row)}_${row.alias}`}
                        modelValue={row.alias}
                        initialValue={() => genInitialAlias(row)}
                        onChange={val => doChange(row, val)}
                    />
                )
            }}
        />
    )
})

export default AliasColumn