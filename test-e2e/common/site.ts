import { type LaunchContext } from './base'
import { sleep } from './util'

export async function setSiteOption(
    context: LaunchContext,
    site: string,
    option: keyof tt4b.site.Options, value: boolean,
) {
    const sitePage = await context.openAppPage(`/tracking/sites?host=${encodeURIComponent(site)}`)
    const switchSelector = `.el-table__row td .el-switch[data-testid="${option}"]`
    await sitePage.waitForSelector(switchSelector, { timeout: 10000 })

    await sitePage.evaluate((sel, expected) => {
        document.querySelectorAll(sel).forEach(sw => {
            if (!(sw instanceof HTMLElement)) return
            const checked = sw.classList.contains('is-checked')
            checked !== expected && sw.click()
        })
    }, switchSelector, value)

    await sitePage.waitForFunction(
        (sel, expected) => Array.from(document.querySelectorAll(sel)).every(cell =>
            cell.classList.contains('is-checked') === expected
        ),
        { timeout: 5000 },
        switchSelector, value,
    )
    await sleep(.5)
    await sitePage.close()
}
