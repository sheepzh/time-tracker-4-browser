import { ElScrollbar } from 'element-plus'
import { type FunctionalComponent, type StyleValue } from "vue"
import ContentContainer from "../common/ContentContainer"
import Description from "./Description"

const About: FunctionalComponent = () => (
    <ElScrollbar height="100%" style={{ width: '100%' } satisfies StyleValue}>
        <ContentContainer>
            <Description />
        </ContentContainer>
    </ElScrollbar>
)
About.displayName = 'About'

export default About