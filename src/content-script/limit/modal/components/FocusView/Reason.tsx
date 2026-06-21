import type { FocusReason } from '@cs/limit/types'
import { t } from '@cs/locale'
import Flex from '@pages/components/Flex'
import { matchUrl } from '@util/limit'
import { ElDescriptions, ElDescriptionsItem, ElTag } from 'element-plus'
import { defineComponent } from 'vue'
import { useApp } from '../../context'
import { useDescriptions } from '../common'

const Reason = defineComponent<{ value: FocusReason }>(props => {
    const { url } = useApp()
    const descProps = useDescriptions()
    return () => (
        <Flex justify='center' marginBottom={30}>
            <ElDescriptions border column={1} {...descProps.value}>
                <ElDescriptionsItem
                    v-show={props.value.presetName}
                    label={t(msg => msg.shared.focus.presetName)}
                    labelAlign='right'
                >
                    {props.value.presetName}
                </ElDescriptionsItem>
                <ElDescriptionsItem
                    label={t(msg => msg.shared.focus.policy[props.value.policy].label)}
                    labelAlign='right'
                >
                    <Flex gap={2} wrap align='center'>
                        {props.value.cond.map(c => (
                            <ElTag
                                type={matchUrl(c, url.value) ? 'danger' : 'info'}
                                size="small"
                            >
                                {c}
                            </ElTag>
                        ))}
                    </Flex>
                </ElDescriptionsItem>
                <ElDescriptionsItem
                    label={t(msg => msg.shared.focus.duration)}
                    labelAlign='right'
                >
                    {props.value.currentDuration}
                </ElDescriptionsItem>
            </ElDescriptions>
        </Flex>
    )
}, { props: ['value'] })

export default Reason