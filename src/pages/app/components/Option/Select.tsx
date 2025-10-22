import { t } from "@app/locale"
import { css } from '@emotion/css'
import { ElCard, ElSelect, useNamespace } from "element-plus"
import { defineComponent, h, ref, useSlots, watch } from "vue"
import { useRouter } from "vue-router"
import ContentContainer from "../common/ContentContainer"
import { CATE_LABELS, changeQuery, type OptionCategory, parseQuery } from "./common"
import { useOptionLine } from './style'

const IGNORED_CATE: OptionCategory[] = ['dailyLimit']

const useStyle = () => {
    const { lineClz, defaultClz } = useOptionLine()
    const dividerNs = useNamespace('divider')
    const selectNs = useNamespace('select')
    const inputNs = useNamespace('input')

    return css`
        .${dividerNs.m('horizontal')} {
            margin: 12px 0;
        }
        .${lineClz} .${selectNs.b()},.${inputNs.b()} {
                margin-inline-start: 4px !important;
        }
        .${defaultClz} {
            display: none !important;
        }
    `
}

const _default = defineComponent(() => {
    const tab = ref<OptionCategory>(parseQuery() || 'appearance')
    const router = useRouter()
    watch(tab, () => changeQuery(tab.value, router))

    const slots = useSlots()
    const clz = useStyle()

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
                return !!slot && <ElCard class={clz}>{h(slot)}</ElCard>
            }
        }} />
    )
})

export default _default