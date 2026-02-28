/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { t } from "@app/locale"
import { Delete, EditPen } from "@element-plus/icons-vue"
import { css } from '@emotion/css'
import Flex from "@pages/components/Flex"
import { ElButton, ElCard, ElDivider, ElMessageBox, ElTag, type TagProps, useNamespace } from "element-plus"
import { defineComponent, type FunctionalComponent, type StyleValue } from "vue"
import { verifyCanModify } from "../../common"
import { useLimitAction, useLimitTable } from "../../context"
import Rule from "./Rule"

type Props = {
    value: timer.limit.Item
}

const CARD_PADDING = 10

const useStyle = () => {
    const cardNs = useNamespace('card')
    const cardCls = css`
        .${cardNs.e('body')}  {
            padding: ${CARD_PADDING}px;
        }
    `
    return cardCls
}

const ALL_WEEKDAYS = t(msg => msg.calendar.weekDays).split('|')

const Divider: FunctionalComponent<{}> = () => {
    const marginInline = `${-CARD_PADDING}px`
    const width = `calc(100% + ${CARD_PADDING * 2}px)`
    return <ElDivider style={{ marginBlock: '6px', marginInline, width } satisfies StyleValue} />
}

const EffectiveDays: FunctionalComponent<{ weekdays?: number[] }> = ({ weekdays = [] }) => {
    const weekdayNum = weekdays?.length
    let text: string = ''
    let type: TagProps['type'] | undefined = undefined
    if (!weekdayNum || weekdayNum === 7) {
        text = t(msg => msg.calendar.range.everyday)
        type = 'success'
    } else if (weekdayNum === 1) {
        text = ALL_WEEKDAYS[weekdays[0]]
    } else {
        const firstDay = ALL_WEEKDAYS[weekdays[0]]
        text = `${firstDay}...${weekdayNum}`
    }

    return <ElTag size="small" type={type}>{text}</ElTag>
}

const _default = defineComponent<Props>(props => {
    const { deleteRow } = useLimitTable()
    const { modify } = useLimitAction()

    const handleModify = () => verifyCanModify(props.value)
        .then(() => modify(props.value))
        .catch(() => {/** Do nothing */ })

    const handleDelete = () => verifyCanModify(props.value)
        .then(() => ElMessageBox.confirm(t(msg => msg.limit.message.deleteConfirm, { name: props.value.name })))
        .then(() => deleteRow(props.value))
        .catch(() => {/** Do nothing */ })

    const clz = useStyle()

    return () => (
        <ElCard class={clz} shadow="hover">
            <Flex column gap={8}>
                <Flex justify="space-between" align="center">
                    <Flex align="center" gap={8}>
                        <span style={{ fontWeight: 'bold' }}>
                            {props.value.name ?? 'Unnamed'}
                        </span>
                        <EffectiveDays weekdays={props.value.weekdays} />
                    </Flex>
                    <ElButton
                        size="small"
                        type='danger'
                        text
                        icon={Delete}
                        onClick={handleDelete}
                    />
                </Flex>
                <Divider />
                {/* Sites */}
                <Flex gap={2}>
                    {props.value.cond.map((c, idx) => <ElTag key={idx} type='info'>{c}</ElTag>)}
                </Flex>
                <Divider />
                {/** Content */}
                <Rule value={props.value} />
                <Divider />
                {/* Footer Button */}
                <Flex justify='end'>
                    <ElButton text icon={EditPen} onClick={handleModify} size='small'>
                        {t(msg => msg.button.modify)}
                    </ElButton>
                </Flex>
            </Flex>
        </ElCard >
    )
}, { props: ['value'] })

export default _default
