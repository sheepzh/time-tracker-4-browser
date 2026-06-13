import Box from '@pages/components/Box'
import Flex from '@pages/components/Flex'
import { t } from '@popup/locale'
import { ElCard, ElText } from 'element-plus'
import { defineComponent, type StyleValue } from 'vue'
import { useFocusSetup } from '../context'
import { TEMPLATE_EMOJIS } from './constants'

const CARD_STYLE: StyleValue = {
    cursor: 'pointer',
    flex: '1',
    transition: 'box-shadow .2s',
}

type CardProps = {
    value: tt4b.focus.Template
    emoji: string
    onClick: ArgCallback<tt4b.focus.Template>
}

const Card = defineComponent<CardProps>(props => {
    return () => (
        <Box style={CARD_STYLE} onClick={() => props.onClick(props.value)}>
            <ElCard shadow='hover'>
                <Flex column align='center' gap={10} padding='8px 0'>
                    <span style={{ fontSize: '32px' }}>{props.emoji}</span>
                    <ElText tag='b' size='large'>{t(msg => msg.shared.focus.template[props.value].label)}</ElText>
                    <ElText size='small' type='info' style={{ textAlign: 'center' } satisfies StyleValue}>
                        {t(msg => msg.shared.focus.template[props.value].desc)}
                    </ElText>
                </Flex>
            </ElCard>
        </Box>
    )
}, { props: ['value', 'emoji', 'onClick'] })

const TemplateSelect = defineComponent(() => {
    const { selectTemplate: onChange } = useFocusSetup()

    return () => (
        <Flex column flex={1} gap={24} align='center' justify='center' padding='20px 8px'>
            <ElText size='large' tag='b'>{t(msg => msg.focus.template.title)}</ElText>
            <Flex gap={16} column width='50%'>
                {Object.entries(TEMPLATE_EMOJIS).map(([value, emoji]) => (
                    <Card
                        key={value}
                        value={value as tt4b.focus.Template}
                        emoji={emoji}
                        onClick={onChange}
                    />
                ))}
            </Flex>
        </Flex>
    )
})

export default TemplateSelect
