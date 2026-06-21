import { APP_FOCUS_ROUTE } from '@/shared/route'
import { css } from '@emotion/css'
import Flex from '@pages/components/Flex'
import { HEADER_OPTION_SLOT, TOOLBAR_SLOT } from '@popup/slot'
import { getAppPageUrl } from '@util/constant/url'
import { defineComponent, FunctionalComponent, Teleport } from 'vue'
import { OptionLink } from '../Option'
import { initFocusContext } from './context'
import SessionToolbar from './session/SessionToolbar'
import SessionView from './session/SessionView'
import MethodSelect from './setup/MethodSelect'
import SetupForm from './setup/SetupForm'
import SetupToolbar from './setup/SetupToolbar'

const FOCUS_URL = getAppPageUrl(APP_FOCUS_ROUTE)

const toolbarCls = css`
    & .el-button+.el-button {
        margin-inline-start: 0 !important;
    }
`

const Toolbar: FunctionalComponent<{}> = () => (
    <Flex gap={8} class={toolbarCls}>
        <SessionToolbar />
        <SetupToolbar />
    </Flex>
)

const Content: FunctionalComponent<{ session?: tt4b.focus.Session, method?: tt4b.focus.Method }> = props => {
    if (props.session) return <SessionView session={props.session} />
    return props.method ? <SetupForm /> : <MethodSelect />
}

const FocusMode = defineComponent<{}>(() => {
    const { session, method } = initFocusContext()

    return () => <>
        <Teleport defer to={`#${TOOLBAR_SLOT}`} >
            <Toolbar />
        </Teleport>
        <Teleport defer to={`#${HEADER_OPTION_SLOT}`}>
            <OptionLink href={FOCUS_URL} />
        </Teleport>
        <Content session={session.value} method={method.value} />
    </>
})

export default FocusMode