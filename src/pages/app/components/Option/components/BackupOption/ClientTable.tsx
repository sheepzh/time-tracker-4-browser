/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import { cvt2LocaleTime } from "@app/util/time"
import { Loading, RefreshRight } from "@element-plus/icons-vue"
import { css } from '@emotion/css'
import { useRequest } from "@hooks"
import { type ElTableRowScope } from "@pages/element-ui/table"
import processor from "@service/backup/processor"
import metaService from "@service/meta-service"
import { ElLink, ElMessage, ElRadio, ElTable, ElTableColumn, ElTag, useNamespace } from "element-plus"
import { defineComponent, ref, toRaw } from "vue"

const formatTime = (value: timer.backup.Client): string => {
    const { minDate, maxDate } = value || {}
    const min = minDate ? cvt2LocaleTime(minDate) : ''
    const max = maxDate ? cvt2LocaleTime(maxDate) : ''
    return `${min} - ${max}`
}

const useTableStyle = () => {
    const radioNs = useNamespace('radio')
    const tagNs = useNamespace('tag')
    return css`
        .${radioNs.e('label')} {
            padding: 0;
        }
        .${tagNs.b()} {
            height: 20px;
            margin-inline: 6px 0;
        }
    `
}

const _default = defineComponent<{ onSelect: ArgCallback<timer.backup.Client> }>(props => {
    const { data: list, loading, refresh } = useRequest(async () => {
        const { success, data, errorMsg } = await processor.listClients() || {}
        if (!success) {
            throw new Error(errorMsg)
        }
        return data
    }, {
        defaultValue: [],
        onError: e => ElMessage.error(typeof e === 'string' ? e : (e as Error).message || 'Unknown error...')
    })

    const { data: localCid } = useRequest(() => metaService.getCid())

    const selectedCid = ref<string>()
    const handleRowSelect = (row: timer.backup.Client) => {
        selectedCid.value = row.id
        props.onSelect?.(toRaw(row))
    }

    const tableClz = useTableStyle()

    return () => (
        <ElTable
            data={list.value}
            border
            maxHeight="40vh"
            class={tableClz}
            highlightCurrentRow
            onCurrent-change={(row: timer.backup.Client) => handleRowSelect(row)}
            emptyText={loading.value ? 'Loading data ...' : 'Empty data'}
        >
            <ElTableColumn
                align="center"
                width={50}
                v-slots={{
                    header: () => (
                        <ElLink
                            icon={loading.value ? <Loading /> : <RefreshRight />}
                            onClick={refresh}
                            type="primary"
                            underline="never"
                        />
                    ),
                    default: ({ row }: ElTableRowScope<timer.backup.Client>) => (
                        <ElRadio
                            value={row.id}
                            modelValue={selectedCid.value}
                            onChange={() => handleRowSelect(row)}
                        />
                    ),
                }}
            />
            <ElTableColumn
                label="CID"
                align="center"
                headerAlign="center"
                width={320}
                formatter={(client: timer.backup.Client) => client.id || '-'}
            />
            <ElTableColumn
                label={t(msg => msg.option.backup.client, { input: '' })}
                align="center"
                headerAlign="center"
            >
                {({ row: client }: ElTableRowScope<timer.backup.Client>) => <>
                    {client.name || '-'}
                    <ElTag v-show={localCid.value === client?.id} size="small" type="danger">
                        {t(msg => msg.option.backup.clientTable.current)}
                    </ElTag>
                </>}
            </ElTableColumn>
            <ElTableColumn
                label={t(msg => msg.option.backup.clientTable.dataRange)}
                align="center"
                headerAlign="center"
                formatter={formatTime}
            />
        </ElTable>
    )
}, { props: ['onSelect'] })

export default _default