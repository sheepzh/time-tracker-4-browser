import Grid from '@pages/components/Grid'
import { defineComponent } from 'vue'
import { useFocusList } from '../context'
import Preset from './Preset'

const Content = defineComponent<{}>(() => {
    const { presets } = useFocusList()

    return () => (
        <Grid minColumnWidth={300} columnGap={12} rowGap={12}>
            {presets.value.map(preset => (
                <Preset key={preset.id} value={preset} />
            ))}
        </Grid>
    )
})

export default Content