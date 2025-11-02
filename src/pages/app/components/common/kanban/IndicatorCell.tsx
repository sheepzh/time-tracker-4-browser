/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { computeRingText, type RingValue, type ValueFormatter } from "@app/components/Analysis/util"
import { tN, type I18nKey } from "@app/locale"
import { BottomRight, InfoFilled, TopRight } from "@element-plus/icons-vue"
import { useXsState } from '@hooks/useMediaSize'
import Box from "@pages/components/Box"
import Flex from "@pages/components/Flex"
import { colorVariant } from '@pages/util/style'
import { range } from "@util/array"
import { ElIcon, ElTooltip } from "element-plus"
import { computed, defineComponent, type CSSProperties } from "vue"

const SubVal = defineComponent<{ value: string }>(props => {
    return () => (
        <Flex as='span' color='text-primary' margin='0 3px'>
            {props.value}
        </Flex>
    )
}, { props: ['value'] })

const computeComparison = (value: RingValue) => {
    const [current = 0, last = 0] = value
    if (current === last) return false
    const color = current > last ? colorVariant('danger') : colorVariant('success', 'light', 3)
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

const renderIcons = (val: ReturnType<typeof computeComparison>) => {
    if (!val) return false
    const { color, count, Icon } = val

    return (
        <Flex color={`var(${color})`}>
            {range(count).map(() => <ElIcon><Icon /></ElIcon>)}
        </Flex>
    )
}

const ComparisonIcon = defineComponent<{ value: RingValue }>(props => {
    const comp = computed(() => computeComparison(props.value))
    return () => renderIcons(comp.value)
}, { props: ['value'] })

const RingLine = defineComponent<{ value: RingValue, formatter?: ValueFormatter }>(props => {
    const text = computed(() => computeRingText(props.value, props.formatter))
    return () => text.value ? <>
        <SubVal value={text.value} />
        <ComparisonIcon value={props.value} />
    </> : <>
        <SubVal value='-' />
    </>
}, { props: ['value', 'formatter'] })

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

const _default = defineComponent<Props>(props => {
    return () => (
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
}, { props: ['mainName', 'mainValue', 'subInfo', 'subRing', 'subTips', 'subValue', 'containerStyle', 'valueFormatter'] })

export default _default