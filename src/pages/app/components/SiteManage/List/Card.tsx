import { deleteSites, modifySite } from '@api/sw/site'
import { t } from '@app/locale'
import { Delete } from '@element-plus/icons-vue'
import { useOperation } from '@hooks'
import ConfirmButton from '@pages/components/ConfirmButton'
import Flex from '@pages/components/Flex'
import { ElCard, ElDivider, ElSwitch, ElTag, ElText, type TagProps } from 'element-plus'
import { defineComponent, type FunctionalComponent, type StyleValue } from 'vue'

const TYPE_TAG: Record<tt4b.site.Type, TagProps['type']> = {
    normal: undefined,
    merged: 'info',
    virtual: 'success'
}

const CARD_PADDING = 10

type Props = {
    value: tt4b.site.SiteInfo
    onChanged: NoArgCallback
    onDeleted: NoArgCallback
}

const Divider: FunctionalComponent<{}> = () => {
    const marginInline = `${-CARD_PADDING}px`
    const width = `calc(100% + ${CARD_PADDING * 2}px)`
    return <ElDivider style={{ marginBlock: '6px', marginInline, width } satisfies StyleValue} />
}

const Card = defineComponent<Props>(props => {
    const doDelete = useOperation(() => deleteSites(props.value), { onSuccess: props.onDeleted })
    const toggleWhite = useOperation(() => modifySite({
        ...props.value,
        options: { ...props.value.options, white: !props.value.options?.white }
    }), { onSuccess: props.onChanged })

    return () => (
        <ElCard shadow='never' bodyStyle={{ padding: `${CARD_PADDING}px` }}>
            <Flex column gap={8}>
                <Flex justify='space-between' align='center'>
                    <Flex gap={8} wrap>
                        <ElText>{props.value.host}</ElText>
                        <ElTag size='small' type={TYPE_TAG[props.value.type]}>
                            {t(msg => msg.shared.site.type[props.value.type])}
                        </ElTag>
                    </Flex>
                    <ConfirmButton
                        buttonProps={{ icon: Delete, type: 'danger', size: 'small', link: true }}
                        onConfirm={doDelete}
                    >
                        {t(msg => msg.button.delete)}
                    </ConfirmButton>
                </Flex>
                <Divider />
                <Flex align='center' gap={5} onClick={toggleWhite}>
                    <ElText size='small' type='info'>{t(msg => msg.siteManage.column.white)}</ElText>
                    <ElSwitch size='small' modelValue={props.value.options?.white} />
                </Flex>
            </Flex>
        </ElCard>
    )
}, { props: ['value', 'onChanged', 'onDeleted'] })

export default Card