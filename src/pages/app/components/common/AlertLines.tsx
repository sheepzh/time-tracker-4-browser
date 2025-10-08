import { I18nKey, t, tN } from '@app/locale'
import { ElAlert } from 'element-plus'
import type { FunctionalComponent, StyleValue } from 'vue'

const STYLE: StyleValue = {
    padding: "15px 25px",
}

const AlertLines: FunctionalComponent<{
    lines: (I18nKey | [I18nKey, param: any])[]
    title: I18nKey
}> = ({ lines, title }) => (
    <ElAlert title={t(title)} closable={false} style={STYLE}>
        {lines.map(l => <li>{Array.isArray(l) ? tN(l[0], l[1]) : t(l)}</li>)}
    </ElAlert>
)

AlertLines.displayName = 'AlertLines'

export default AlertLines