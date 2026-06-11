import { LaunchContext } from './base'
import { createWhitelist } from './whitelist'

// Run to test the function, but skip it in normal test runs
test.skip('create whitelist', async () => {
    const context = new LaunchContext()
    await context.launch()
    await createWhitelist(context, 'example.com')
})