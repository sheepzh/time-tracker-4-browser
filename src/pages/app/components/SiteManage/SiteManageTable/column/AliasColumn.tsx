/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { batchGetSites, batchSaveAliasNoRewrite, getSitePslSuffix, removeAlias, saveAlias } from "@api/sw/site"
import Editable from "@app/components/common/Editable"
import { t } from '@app/locale'
import { MagicStick } from "@element-plus/icons-vue"
import Flex from "@pages/components/Flex"
import { identifySiteKey, SiteMap } from "@util/site"
import { ElIcon, ElMessage, ElPopconfirm, ElTableColumn, ElText } from "element-plus"
import { toUnicode as punyCode2Unicode } from "punycode"
import { defineComponent, type StyleValue } from "vue"
import { useSiteManageTable } from '../../useSiteManage'

function cvt2Alias(part: string): string {
    let decoded = part
    try {
        decoded = punyCode2Unicode(part)
    } catch {
    }
    return decoded.charAt(0).toUpperCase() + decoded.slice(1)
}

export async function genInitialAlias(site: timer.site.SiteInfo): Promise<string | undefined> {
    const { host, alias, type } = site || {}
    if (alias) return
    if (type !== 'normal') return
    let parts = host.split('.')
    if (parts.length < 2) return

    const suffix = await getSitePslSuffix(host)
    const prefix = host.replace(`.${suffix}`, '').replace(/^www\./, '')
    parts = prefix.split('.')
    return parts.reverse().map(cvt2Alias).join(' ')
}

const AliasColumn = defineComponent<{}>(() => {
    const { pagination, refresh } = useSiteManageTable()

    const handleChange = async (newAlias: string | undefined, row: timer.site.SiteInfo) => {
        newAlias = newAlias?.trim?.()
        row.alias = newAlias
        if (newAlias) {
            await saveAlias(row, newAlias)
        } else {
            await removeAlias(row)
        }
        refresh()
    }

    const handleBatchGenerate = async () => {
        let data = pagination.value?.list
        if (!data?.length) {
            return ElMessage.info("No data")
        }
        const toSave = new SiteMap<string>()
        const items = await batchGetSites(data)
        for (const site of items) {
            if (site.alias) continue
            const newAlias = await genInitialAlias(site)
            newAlias && toSave.put(site, newAlias)
        }
        const arr: Array<{ key: timer.site.SiteKey; alias: string }> = []
        toSave.forEach((k, alias) => alias != null && arr.push({ key: k, alias }))
        await batchSaveAliasNoRewrite(arr)
        refresh()
        ElMessage.success(t(msg => msg.operation.successMsg))
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
                default: ({ row }: { row: timer.site.SiteInfo }) => <Editable
                    key={`${identifySiteKey(row)}_${row.alias}`}
                    modelValue={row.alias}
                    initialValue={() => genInitialAlias(row)}
                    onChange={val => handleChange(val, row)}
                />
            }}
        />
    )
})

export default AliasColumn