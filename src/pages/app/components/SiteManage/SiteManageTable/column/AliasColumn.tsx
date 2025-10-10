/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import Editable from "@app/components/common/Editable"
import { t } from "@app/locale"
import { MagicStick } from "@element-plus/icons-vue"
import Flex from "@pages/components/Flex"
import siteService from "@service/site-service"
import { getSuffix as getPslSuffix } from "@util/psl"
import { identifySiteKey } from "@util/site"
import { ElIcon, ElPopconfirm, ElTableColumn, ElText } from "element-plus"
import { toUnicode as punyCode2Unicode } from "punycode"
import { defineComponent, type StyleValue } from "vue"

function cvt2Alias(part: string): string {
    let decoded = part
    try {
        decoded = punyCode2Unicode(part)
    } catch {
    }
    return decoded.charAt(0).toUpperCase() + decoded.slice(1)
}

export function genInitialAlias(site: timer.site.SiteInfo): string | undefined {
    const { host, alias, type } = site || {}
    if (alias) return
    if (type !== 'normal') return
    let parts = host.split('.')
    if (parts.length < 2) return

    const suffix = getPslSuffix(host)
    const prefix = host.replace(`.${suffix}`, '').replace(/^www\./, '')
    parts = prefix.split('.')
    return parts.reverse().map(cvt2Alias).join(' ')
}

const _default = defineComponent({
    emits: {
        rowAliasSaved: (_row: timer.site.SiteInfo) => true,
        batchGenerate: () => true,
    },
    setup: (_, ctx) => {
        const handleChange = async (newAlias: string | undefined, row: timer.site.SiteInfo) => {
            newAlias = newAlias?.trim?.()
            row.alias = newAlias
            if (newAlias) {
                await siteService.saveAlias(row, newAlias)
            } else {
                await siteService.removeAlias(row)
            }
            ctx.emit("rowAliasSaved", row)
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
                                onConfirm={() => ctx.emit('batchGenerate')}
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
                        initialValue={genInitialAlias(row)}
                        onChange={val => handleChange(val, row)}
                    />
                }}
            />
        )
    }
})

export default _default