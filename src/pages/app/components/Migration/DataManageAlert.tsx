import { t, type I18nKey } from '@app/locale'
import { ElAlert, type AlertProps } from 'element-plus'
import { computed, defineComponent } from 'vue'

type Props = {
    type?: AlertProps['type']
    text: I18nKey | string
}

const DataManageAlert = defineComponent<Props>(props => {
    const message = computed(() =>
        typeof props.text === 'string' ? props.text : t(props.text))

    return () => (
        <div
            style={{
                flexShrink: 0,
                width: '100%',
                minHeight: 52,
                display: 'flex',
                alignItems: 'center',
                boxSizing: 'border-box',
            }}
        >
            <ElAlert type={props.type ?? 'info'} closable={false} center style={{ width: '100%' }}>
                {message.value}
            </ElAlert>
        </div>
    )
}, { props: ['text', 'type'] })

export default DataManageAlert