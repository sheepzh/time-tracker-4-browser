import { t, type I18nKey } from '@app/locale'
import { ElAlert, type AlertProps } from 'element-plus'
import { computed, defineComponent } from 'vue'

type Props = {
    type?: AlertProps['type']
    text: I18nKey | string
}

const DataManageAlert = defineComponent<Props>(props => {
    const text = computed(() => {
        const text = props.text
        return typeof text === 'string' ? text : t(text)
    })

    return () => (
        <ElAlert type={props.type ?? 'info'} closable={false} center>
            {text.value}
        </ElAlert>
    )
}, { props: ['text', 'type'] })

export default DataManageAlert