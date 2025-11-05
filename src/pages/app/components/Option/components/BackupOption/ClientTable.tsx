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
import processor from "@service/backup/processor"
import { getCid } from "@service/meta-service"
import {
    ElLink, ElMessage, ElRadio, ElTable, ElTableColumn, ElTag, useNamespace,
    type RenderRowData,
} from "element-plus"
import { defineComponent, ref, StyleValue, toRaw } from "vue"

const useStyle = () => {
    const radioNs = useNamespace('radio')
    const radioCls = css`
        & .${radioNs.e('label')} {
            padding: 0;
        }
    `
    return { radioCls }
}

const formatTime = (value: timer.backup.Client): string => {
    const { minDate, maxDate } = value || {}
    const min = minDate ? cvt2LocaleTime(minDate) : ''
    const max = maxDate ? cvt2LocaleTime(maxDate) : ''
    return `${min} - ${max}`
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

    const { data: localCid } = useRequest(getCid)

    const selectedCid = ref<string>()
    const handleRowSelect = (row: timer.backup.Client) => {
        selectedCid.value = row.id
        props.onSelect?.(toRaw(row))
    }
    const { radioCls } = useStyle()

    return () => (
        <ElTable
            data={list.value}
            border
            maxHeight="40vh"
            class="backup-client-table"
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
                    default: ({ row }: RenderRowData<timer.backup.Client>) => (
                        <ElRadio
                            class={radioCls}
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
                {({ row: client }: RenderRowData<timer.backup.Client>) => <>
                    {client.name || '-'}
                    <ElTag
                        v-show={localCid.value === client?.id}
                        size="small" type="danger"
                        style={{ height: '20px', marginInline: '6px 0' } satisfies StyleValue}
                    >
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