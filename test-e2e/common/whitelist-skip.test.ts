import { launchBrowser } from './base'
import { createWhitelist } from './whitelist'

// Run to test the function, but skip it in normal test runs
test.skip('create whitelist', async () => {
    const context = await launchBrowser()
    await createWhitelist(context, 'example.com')
})