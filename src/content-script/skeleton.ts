import { trySendMsg2Runtime } from '@/api/sw/common'

function awaitDocumentReady() {
    if (document.readyState === 'complete') {
        return Promise.resolve()
    } else {
        return new Promise(resolve => {
            document.addEventListener('DOMContentLoaded', resolve, { once: true })
        })
    }
}

const main = async () => {
    await awaitDocumentReady()
    trySendMsg2Runtime('cs.onInjected')
}

main()
