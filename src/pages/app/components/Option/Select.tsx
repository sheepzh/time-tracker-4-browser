import { t } from "@app/locale"
import { ElCard, ElSelect } from "element-plus"
import { defineComponent, h, ref, useSlots, watch } from "vue"
import { useRouter } from "vue-router"
import ContentContainer from "../common/ContentContainer"
import { CATE_LABELS, changeQuery, type OptionCategory, parseQuery } from "./common"

const IGNORED_CATE: OptionCategory[] = ['limit']

const _default = defineComponent(() => {
    const tab = ref<OptionCategory>(parseQuery() || 'appearance')
    const router = useRouter()
    watch(tab, () => changeQuery(tab.value, router))

    const slots = useSlots()

    return () => (
        <ContentContainer v-slots={{
            filter: () => (
                <ElSelect
                    modelValue={tab.value}
                    onChange={val => tab.value = val}
                >
                    {Object.keys(slots)
                        .filter(key => !IGNORED_CATE.includes(key as OptionCategory) && key !== 'default')
                        .map(cate => (
                            <ElSelect.Option value={cate} label={t(CATE_LABELS[cate as OptionCategory])} />
                        ))
                    }
                </ElSelect>
            ),
            default: () => {
                const slot = slots[tab.value]
                return !!slot && <ElCard
                    class="option-select-card"
                    style={{ "--el-card-padding": '20px 10px' }}
                >{h(slot)}</ElCard>
            }
        }} />
    )
})

export default _default