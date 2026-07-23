import { t } from '@app/locale'
import { Delete } from '@element-plus/icons-vue'
import ConfirmButton from '@pages/components/ConfirmButton'
import Flex from '@pages/components/Flex'
import { getColor } from '@pages/util/style'
import { formatPeriodCommon } from '@util/time'
import { ElButton, ElTable, ElTableColumn, ElTag, ElText, type RenderRowData } from 'element-plus'
import { type CSSProperties, defineComponent, type FunctionalComponent } from 'vue'
import { useFocusList } from './context'

type Scope = RenderRowData<tt4b.focus.Preset>

const formatDuration = (durSec: number): string => {
    if (!durSec) return t(msg => msg.shared.unlimited)
    return formatPeriodCommon(durSec * 1000)
}

const StateDot: FunctionalComponent<{ session: tt4b.focus.Session | undefined, presetId: number }> = ({ session, presetId }) => {
    if (!session || session.presetId !== presetId) return null
    const { state, phase } = session
    if (state !== 'running' && state !== 'paused') return null
    const color = phase === 'break' ? getColor('warning') : state === 'paused' ? getColor('info') : getColor('success')
    const style: CSSProperties = {
        display: 'inline-block',
        width: '8px', height: '8px',
        borderRadius: '50%',
        flexShrink: 0, backgroundColor: color,
    }
    return <span style={style} />
}

const UnlimitedTag: FunctionalComponent<{}> = () => (
    <ElTag type="info" size="small" effect="plain">{t(msg => msg.shared.unlimited)}</ElTag>
)

const Duration: FunctionalComponent<Pick<tt4b.focus.Preset, 'duration' | 'break'>> = ({ duration, break: break_ }) => {
    if (!duration) return <UnlimitedTag />
    return <Flex gap={2} column align="center">
        <ElText>{formatDuration(duration)}</ElText>
        {break_ ? <ElText type="info" size="small">{t(msg => msg.focus.break)}: {formatDuration(break_)}</ElText> : null}
    </Flex>
}

const FilterPolicy: FunctionalComponent<Pick<tt4b.focus.Config, 'policy' | 'cond'>> = ({ policy, cond }) => {
    if (policy === 'block' && !cond.length) return <UnlimitedTag />
    return <Flex column gap={2} align="center">
        <ElTag size="small" type={policy === 'block' ? 'danger' : 'success'}>
            {t(msg => msg.focus.policy[policy].label)}
        </ElTag>
        {cond.map(c => <span style={{ display: 'block' }}>{c}</span>)}
    </Flex>
}

const Table = defineComponent<{}>(() => {
    const { presets, session, remove, modifyInst } = useFocusList()

    return () => (
        <ElTable data={presets.value} border fit highlightCurrentRow>
            <ElTableColumn label={t(msg => msg.focus.presetName)} >
                {({ row: { id, name } }: Scope) => (
                    <Flex inline align='center' gap={5}>
                        <StateDot session={session.value} presetId={id} />
                        <span>{name}</span>
                    </Flex>
                )}
            </ElTableColumn>
            <ElTableColumn
                label={t(msg => msg.focus.method.label)}
                minWidth={100}
                align="center"
                formatter={({ method }: tt4b.focus.Preset) => t(msg => msg.focus.method[method].label)}
            />
            <ElTableColumn
                label={t(msg => msg.focus.duration)}
                minWidth={120}
                align="center"
            >
                {({ row }: Scope) => <Duration duration={row.duration} break={row.break} />}
            </ElTableColumn>
            <ElTableColumn
                label={t(msg => msg.focus.policy.label)}
                minWidth={200}
                align="center"
            >
                {({ row: { policy, cond } }: Scope) => policy && <FilterPolicy policy={policy} cond={cond} />}
            </ElTableColumn>
            <ElTableColumn
                label={t(msg => msg.button.operation)}
                width={220}
                align="center"
            >
                {({ row }: Scope) => <>
                    <ElButton size="small" type="primary" onClick={() => modifyInst.value?.modify(row)}>
                        {t(msg => msg.button.modify)}
                    </ElButton>
                    <ConfirmButton
                        buttonText={t(msg => msg.button.delete)}
                        buttonProps={{ size: 'small', type: 'danger', icon: Delete }}
                        onConfirm={() => remove(row.id)}
                    />
                </>}
            </ElTableColumn>
        </ElTable>
    )
})

export default Table