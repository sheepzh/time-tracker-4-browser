/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { tN, type I18nKey } from "@app/locale"
import { BottomRight, InfoFilled, TopRight } from "@element-plus/icons-vue"
import { useXsState } from '@hooks'
import Box from "@pages/components/Box"
import Flex from "@pages/components/Flex"
import { colorVariant, getCssVariable } from '@pages/util/style'
import { ElIcon, ElTooltip } from "element-plus"
import { defineComponent, type CSSProperties, type FunctionalComponent } from "vue"
import type { RingValue, ValueFormatter } from './types'

const SubVal: FunctionalComponent<{ value: string }> = ({ value }) => (
    <Flex as='span' color='text-primary' margin='0 3px'>
        {value}
    </Flex>
)

const computeComparison = (value: RingValue) => {
    const [current = 0, last = 0] = value
    if (current === last) return false
    const colorVar = current > last ? colorVariant('danger') : colorVariant('success', 'light', 3)
    const color = getCssVariable(colorVar)
    const Icon = current > last ? TopRight : BottomRight
    let count = 0
    if (current === 0 || last === 0) {
        count = 3
    } else {
        // rate not in {0, 1, infinite}
        // so log2(rate) not in {-infinite, 0, +infinite}
        const rate = current / last
        count = Math.min(Math.ceil(Math.abs(Math.log2(rate))), 3)
    }
    return count ? { color, Icon, count } : false
}

const ComparisonIcon: FunctionalComponent<{ value: RingValue }> = props => {
    const comp = computeComparison(props.value)
    if (!comp) return null
    const { color, count, Icon } = comp
    return (
        <Flex color={color}>
            {Array.from({ length: count }).map((_, idx) => <ElIcon key={idx}><Icon /></ElIcon>)}
        </Flex>
    )
}

const RingLine: FunctionalComponent<{ value: RingValue, formatter?: ValueFormatter }> = props => {
    const { value, formatter } = props
    const [current, last] = value

    if (current === undefined && last === undefined) return <SubVal value='-' />

    const delta = (current ?? 0) - (last ?? 0)
    const deltaText = formatter?.(delta) ?? delta?.toString()
    const text = delta >= 0 ? `+${deltaText}` : deltaText
    return <>
        <SubVal value={text} />
        <ComparisonIcon value={props.value} />
    </>
}

type SubProps = {
    value?: string
    ring?: RingValue
    formatter?: ValueFormatter
    tips?: I18nKey
    info?: string
}

const SubLine = defineComponent<SubProps>(props => {
    const isXs = useXsState()
    return () => (
        <Flex
            wrap align='center' height={17}
            color='text-secondary' fontSize={12}
            style={{ wordBreak: 'break-word', margin: isXs.value ? '0 auto' : undefined }}
        >
            {props.ring
                ? <RingLine value={props.ring} formatter={props.formatter} /> :
                <>
                    {props.tips && tN(props.tips, { value: <SubVal value={props.value ?? '-'} /> })}
                    {!props.tips && props.value && <SubVal value={props.value} />}
                    {props.info && <Flex inline align="center" height="100%" marginInline='2px 0px'>
                        <ElTooltip content={props.info} placement="bottom">
                            <ElIcon><InfoFilled /></ElIcon>
                        </ElTooltip>
                    </Flex>}
                </>}
        </Flex>
    )
}, { props: ['info', 'ring', 'tips', 'value', 'formatter'] })

type Props = {
    subTips?: I18nKey
    subValue?: string
    subInfo?: string
    subRing?: RingValue
    valueFormatter?: ValueFormatter
    mainName: string
    mainValue: string
    containerStyle?: CSSProperties
}

const IndicatorCell: FunctionalComponent<Props> = props => {
    return (
        <Flex
            column justify="center"
            minHeight={140}
            boxSizing="border-box"
            position="relative"
            paddingBlock={10}
            paddingInline="40px 20px"
            style={props.containerStyle}
        >
            <Box fontSize={14} color="text-secondary">{props.mainName}</Box>
            <Box fontSize={24} marginBlock='.25em .6em'>
                {props.mainValue ?? '-'}
            </Box>
            <SubLine
                ring={props.subRing} value={props.subValue} formatter={props.valueFormatter}
                tips={props.subTips} info={props.subInfo}
            />
        </Flex>
    )
}
IndicatorCell.displayName = 'IndicatorCell'

export default IndicatorCell