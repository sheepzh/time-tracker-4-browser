import Box from '@pages/components/Box'
import Flex from '@pages/components/Flex'
import { t } from '@popup/locale'
import { ElCard, ElText } from 'element-plus'
import { defineComponent, type StyleValue } from 'vue'
import { useFocusSetup } from '../context'
import { METHOD_EMOJIS } from './constants'

const CARD_STYLE: StyleValue = {
    cursor: 'pointer',
    flex: '1',
    transition: 'box-shadow .2s',
}

type CardProps = {
    value: tt4b.focus.Method
    emoji: string
    onClick: ArgCallback<tt4b.focus.Method>
}

const Card = defineComponent<CardProps>(props => {
    return () => (
        <Box style={CARD_STYLE} onClick={() => props.onClick(props.value)}>
            <ElCard shadow='hover'>
                <Flex column align='center' gap={10} padding='8px 0'>
                    <span style={{ fontSize: '32px' }}>{props.emoji}</span>
                    <ElText tag='b' size='large'>{t(msg => msg.shared.focus.method[props.value].label)}</ElText>
                    <ElText size='small' type='info' style={{ textAlign: 'center' } satisfies StyleValue}>
                        {t(msg => msg.shared.focus.method[props.value].desc)}
                    </ElText>
                </Flex>
            </ElCard>
        </Box>
    )
}, { props: ['value', 'emoji', 'onClick'] })

const MethodSelect = defineComponent<{}>(() => {
    const { apply } = useFocusSetup()

    return () => (
        <Flex column flex={1} gap={24} align='center' justify='center' padding='20px 8px'>
            <ElText size='large' tag='b'>{t(msg => msg.focus.chooseMethod)}</ElText>
            <Flex gap={16} column width='50%'>
                {Object.entries(METHOD_EMOJIS).map(([value, emoji]) => (
                    <Card
                        key={value}
                        value={value as tt4b.focus.Method}
                        emoji={emoji}
                        onClick={apply}
                    />
                ))}
            </Flex>
        </Flex>
    )
})

export default MethodSelect
