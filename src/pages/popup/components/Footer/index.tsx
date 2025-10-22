import Flex from "@pages/components/Flex"
import { useQuery } from "@popup/context"
import { t } from "@popup/locale"
import { ALL_DIMENSIONS } from "@util/stat"
import { ElOption, ElSelect, ElText } from "element-plus"
import { defineComponent } from "vue"
import DurationSelect from './DurationSelect'
import Menu from "./Menu"

const Footer = defineComponent(() => {
    const query = useQuery()

    return () => (
        <Flex justify="space-between" width="100%">
            <Flex>
                <Menu />
            </Flex>
            <Flex gap={8}>
                <Flex gap={4}>
                    <ElText>{t(msg => msg.shared.merge.mergeBy)}</ElText>
                    <ElSelect
                        modelValue={query.mergeMethod}
                        onChange={v => query.mergeMethod = v ?? undefined}
                        placeholder={t(msg => msg.shared.merge.mergeMethod.notMerge)}
                        popperOptions={{ placement: 'top' }}
                        style={{ width: '90px' }}
                    >
                        <ElOption value='' label={t(msg => msg.shared.merge.mergeMethod.notMerge)} />
                        {(['domain', 'cate', 'group'] satisfies timer.stat.MergeMethod[]).map(method => (
                            <ElOption value={method} label={t(msg => msg.shared.merge.mergeMethod[method])} />
                        ))}
                    </ElSelect>
                </Flex>
                <DurationSelect
                    reverse
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
                >
                    {ALL_DIMENSIONS.map(item => <ElOption value={item} label={t(msg => msg.item[item])} />)}
                </ElSelect>
            </Flex>
        </Flex >
    )
})

export default Footer