/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { fillInitialAlias, getInitialAlias, modifySite } from "@api/sw/site"
import Editable from "@app/components/common/Editable"
import { useSiteManageTable } from '@app/components/SiteManage/context'
import { t } from '@app/locale'
import { MagicStick } from "@element-plus/icons-vue"
import { useManualRequest, useOperation } from '@hooks'
import Flex from "@pages/components/Flex"
import { identifySiteKey } from "@util/site"
import { ElIcon, ElPopconfirm, ElTableColumn, ElText } from "element-plus"
import { defineComponent, type StyleValue } from "vue"

const AliasColumn = defineComponent<{}>(() => {
    const { pagination, refresh } = useSiteManageTable()
    const { refresh: doChange } = useManualRequest((row: tt4b.site.SiteInfo, alias: string | undefined) => {
        const { type, host, iconUrl } = row
        return modifySite({ type, host, alias, iconUrl })
    }, { onSuccess: refresh })

    const handleBatchGenerate = useOperation(() => fillInitialAlias(pagination.value.list), { onSuccess: refresh })

    const genInitialAlias = async ({ host, type, alias }: tt4b.site.SiteInfo) => {
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
                default: ({ row }: { row: tt4b.site.SiteInfo }) => (
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