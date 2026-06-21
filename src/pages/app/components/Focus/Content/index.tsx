import Grid from '@pages/components/Grid'
import { ElEmpty, ElSkeleton } from 'element-plus'
import { defineComponent } from 'vue'
import { useFocusList } from '../context'
import Preset from './Preset'

const Content = defineComponent<{}>(() => {
    const { presets: list, loading } = useFocusList()

    return () => <>
        <ElSkeleton v-show={loading.value} />
        <ElEmpty v-show={!loading.value && !list.value.length} />
        <Grid minColumnWidth={300} columnGap={12} rowGap={12}>
            {list.value.map(p => <Preset key={p.id} value={p} />)}
        </Grid>
    </>
})

export default Content