import { modifySite } from '@api/sw/site'
import ColumnHeader from '@app/components/common/ColumnHeader'
import { t } from '@app/locale'
import { useManualRequest } from '@hooks'
import { ElSwitch, ElTableColumn } from 'element-plus'
import { defineComponent } from 'vue'
import { RenderParam } from '../types'

const OptionsColumn = defineComponent<{ onChanged: NoArgCallback }>(props => {
    const { refresh: changeOption } = useManualRequest((row: tt4b.site.SiteInfo, key: keyof tt4b.site.Options, value: unknown) => {
        return modifySite({ ...row, options: { ...row.options, [key]: Boolean(value) } })
    }, { onSuccess: props.onChanged })

    return () => (
        <ElTableColumn align='center' label={t(msg => msg.button.configuration)}>
            <ElTableColumn
                label={t(msg => msg.siteManage.column.white)}
                align='center'
                v-slots={{
                    header: () => (
                        <ColumnHeader
                            label={t(msg => msg.siteManage.column.white)}
                            tooltip={t(msg => msg.siteManage.column.whiteInfo)}
                        />
                    ),
                    default: ({ row }: RenderParam) => (
                        <ElSwitch
                            data-testid='white'
                            size='small'
                            modelValue={row.options?.white}
                            onChange={val => changeOption(row, 'white', val)}
                        />
                    )
                }}
            />
            <ElTableColumn
                label={t(msg => msg.item.run)}
                align='center'
                v-slots={({ row }: RenderParam) => (
                    <ElSwitch
                        data-testid='run'
                        size='small'
                        modelValue={row.options?.run}
                        onChange={val => changeOption(row, 'run', val)}
                    />
                )}
            />
            <ElTableColumn
                label={t(msg => msg.item.media)}
                align='center'
                v-slots={({ row }: RenderParam) => (
                    <ElSwitch
                        data-testid='media'
                        size='small'
                        modelValue={row.options?.media}
                        onChange={val => changeOption(row, 'media', val)}
                    />
                )}
            />
        </ElTableColumn>
    )
}, { props: ['onChanged'] })

export default OptionsColumn