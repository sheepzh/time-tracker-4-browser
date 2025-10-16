import { h, type FunctionalComponent, type StyleValue } from "vue"

const OptionTag: FunctionalComponent<{}> = (_, { slots: { default: default_ } }) => (
    <a style={{ color: '#F56C6C' } satisfies StyleValue}>
        {default_ && h(default_)}
    </a>
)
OptionTag.displayName = 'OptionTag'

export default OptionTag
