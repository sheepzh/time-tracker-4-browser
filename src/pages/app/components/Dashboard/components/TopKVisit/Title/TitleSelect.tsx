import { css } from '@emotion/css'
import { ElSelect, useNamespace } from "element-plus"
import { defineComponent } from "vue"
import { type TopKFilterOption, useTopKFilter } from "../context"

type Props = {
    field: keyof TopKFilterOption & ('topK' | 'dayNum')
    values: number[]
}

const useStyle = () => {
    const selectNs = useNamespace('select')
    const selectCls = css`
        margin-inline: 3px;
        width: 28px;
        .${selectNs.e('wrapper')} {
            padding: 2px;
        }
        .${selectNs.e('suffix')} {
            display: none;
        }
        .${selectNs.e('placeholder')} {
            text-align: center;
        }
    `
    const popperCls = css`
        .${selectNs.be('dropdown', 'item')} {
            padding: 0;
            width: 35px;
            height: 24px;
            line-height: 24px;
            text-align: center;
        }
    `
    return { selectCls, popperCls }
}

const TitleSelect = defineComponent<Props>(({ values, field }) => {
    const filter = useTopKFilter()
    const { selectCls, popperCls } = useStyle()
    return () => (
        <ElSelect
            class={selectCls} popperClass={popperCls}
            size="small"
            modelValue={filter[field]}
            onChange={val => filter[field] = val as number}
            popperOptions={{ placement: 'bottom' }}
        >
            {values.map(k => <ElSelect.Option key={k} label={k} value={k} />)}
        </ElSelect >
    )
}, { props: ['field', "values"] })

export default TitleSelect