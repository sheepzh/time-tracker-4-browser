import { I18nKey, t, tN } from '@app/locale'
import { type AlertProps, ElAlert } from 'element-plus'
import type { FunctionalComponent, StyleValue } from 'vue'

const STYLE: StyleValue = {
    padding: "15px 25px",
    lineHeight: "20px",
}

export type AlertLinesProps = {
    title: I18nKey | string
    lines?: (I18nKey | [I18nKey, param: any] | string)[]
    type?: AlertProps['type']
}

const AlertLines: FunctionalComponent<AlertLinesProps> = ({ lines, title, type }) => (
    <ElAlert
        type={type}
        title={typeof title === 'string' ? title : t(title)}
        closable={false}
        style={STYLE}
    >
        {lines?.map(l => <li>{
            Array.isArray(l)
                ? tN(l[0], l[1])
                : (typeof l === 'string' ? l : t(l))
        }</li>)}
    </ElAlert>
)

AlertLines.displayName = 'AlertLines'

export default AlertLines