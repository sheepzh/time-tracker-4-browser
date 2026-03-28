import { EXCLUDING_PREFIX } from '@util/constant/remain-host'
import { compileAntPattern, judgeVirtualFast } from '@util/pattern'

export default class WhitelistProcessor {
    private host: string[] = []
    private virtual: RegExp[] = []
    private exclude: RegExp[] = []

    setWhitelist(whitelist: string[]) {
        const host: string[] = []
        const virtual: RegExp[] = []
        const exclude: RegExp[] = []
        whitelist.forEach(white => {
            if (!white) return
            if (white.startsWith(EXCLUDING_PREFIX)) {
                const val = white.substring(1)
                exclude.push(compileAntPattern(val))
            } else if (judgeVirtualFast(white)) {
                virtual.push(compileAntPattern(white))
            } else {
                host.push(white)
            }
        })
        this.host = host
        this.virtual = virtual
        this.exclude = exclude
    }

    contains(host: string, url: string): boolean {
        if (this.exclude.some(r => r.test(url))) return false
        return this.host.includes(host) || this.virtual.some(r => r.test(url))
    }
}
