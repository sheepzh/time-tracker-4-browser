import { defineComponent } from 'vue'
import ContentContainer from '../common/ContentContainer'
import Grid from './Content'
import Filter from './Filter'

const Focus = defineComponent(() => {
    return () => (
        <ContentContainer v-slots={{
            filter: () => <Filter />,
            default: () => <Grid />,
        }} />
    )
})

export default Focus