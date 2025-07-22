import { type FunctionalComponent } from "vue"
import ContentContainer from "../common/ContentContainer"
import Description from "./Description"

const About: FunctionalComponent = () => (
    <ContentContainer>
        <Description />
    </ContentContainer>
)
About.displayName = 'About'

export default About