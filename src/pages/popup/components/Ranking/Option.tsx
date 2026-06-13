import { t } from '@popup/locale'
import { defineComponent, ref, watch } from "vue"
import Option, { type PopoverInstance } from '../Option'
import { useStatOption } from '../stat/context'

const RankingOption = defineComponent(() => {
    const option = useStatOption()
    const popoverRef = ref<PopoverInstance>()

    watch(() => [option.showName], () => popoverRef.value?.close())

    return () => (
        <Option.Popover ref={popoverRef}>
            <Option.Checkbox
                label={t(msg => msg.header.showSiteName)}
                modelValue={option.showName}
                onChange={v => option.showName = v}
            />
        </Option.Popover>
    )
})

export default RankingOption
