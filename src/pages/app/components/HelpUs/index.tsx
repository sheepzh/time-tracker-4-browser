import { createTabAfterCurrent } from "@api/chrome/tab"
import AlertLines from '@app/components/common/AlertLines'
import { t } from "@app/locale"
import { Pointer } from "@element-plus/icons-vue"
import Box from "@pages/components/Box"
import { CROWDIN_HOMEPAGE } from "@util/constant/url"
import { ElButton, ElCard, ElScrollbar } from "element-plus"
import type { FunctionalComponent, StyleValue } from "vue"
import ContentContainer from "../common/ContentContainer"
import MemberList from "./MemberList"
import ProgressList from "./ProgressList"

const handleJump = () => createTabAfterCurrent(CROWDIN_HOMEPAGE)

const HelpUs: FunctionalComponent = () => (
    <ElScrollbar height="100%" style={{ width: '100%' } satisfies StyleValue}>
        <ContentContainer>
            <ElCard>
                <AlertLines
                    title={msg => msg.helpUs.title}
                    lines={[
                        msg => msg.helpUs.alert.l1,
                        msg => msg.helpUs.alert.l2,
                        msg => msg.helpUs.alert.l3,
                    ]}
                />
                <Box marginBlock={30}>
                    <ElButton type="primary" size="large" icon={Pointer} onClick={handleJump}>
                        {t(msg => msg.helpUs.button)}
                    </ElButton>
                </Box>
                <ProgressList />
                <MemberList />
            </ElCard>
        </ContentContainer>
    </ElScrollbar>
)
HelpUs.displayName = 'HelpUs'

export default HelpUs