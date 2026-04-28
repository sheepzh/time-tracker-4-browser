import { useSiteMerge } from '@hooks'
import Flex from '@pages/components/Flex'
import { useQuery } from '@popup/context'
import { t } from '@popup/locale'
import { ALL_DIMENSIONS } from '@util/stat'
import { ElSelect, ElText } from 'element-plus'
import { defineComponent } from 'vue'
import DurationSelect from './DurationSelect'

const DataToolbar = defineComponent(() => {
    const query = useQuery()

    const { mergeItems } = useSiteMerge({
        onGroupDisabled: () => query.mergeMethod === 'group' && (query.mergeMethod = undefined)
    })

    return () => (
        <Flex gap={8}>
            <Flex gap={4}>
                <ElText>{t(msg => msg.shared.merge.mergeBy)}</ElText>
                <ElSelect
                    modelValue={query.mergeMethod}
                    onChange={v => query.mergeMethod = v ?? undefined}
                    placeholder={t(msg => msg.shared.merge.mergeMethod.notMerge)}
                    popperOptions={{ placement: 'top' }}
                    style={{ width: '90px' }}
                    options={[
                        { value: '', label: t(msg => msg.shared.merge.mergeMethod.notMerge) },
                        ...mergeItems.value.map(value => ({ value, label: t(msg => msg.shared.merge.mergeMethod[value]) })),
                    ]}
                />
            </Flex>
            <DurationSelect
                modelValue={[query.duration, query.durationNum]}
                onChange={([duration, durationNum]) => {
                    query.duration = duration
                    query.durationNum = durationNum
                }}
            />
            <ElSelect
                modelValue={query.dimension}
                onChange={v => query.dimension = v}
                popperOptions={{ placement: 'top' }}
                style={{ width: '120px' }}
                options={ALL_DIMENSIONS.map(value => ({ value, label: t(msg => msg.item[value]) }))}
            />
        </Flex>
    )
})

export default DataToolbar