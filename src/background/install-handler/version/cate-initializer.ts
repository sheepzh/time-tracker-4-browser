import cateDatabase from '@db/cate-database'
import { batchChangeCate } from '@service/site-service'
import type { Migrator } from "./types"

type InitialCate = {
    name: string
    hosts: string[]
}

const DEMO_ITEMS: InitialCate[] = [
    {
        name: 'Video',
        hosts: [
            'www.youtube.com',
            'www.bilibili.com',
        ],
    }, {
        name: 'Tech',
        hosts: [
            'github.com',
            'stackoverflow.com',
        ],
    }, {
        name: 'Info',
        hosts: [
            'www.baidu.com',
            'www.google.com',
        ],
    }
]

async function initItem(item: InitialCate) {
    const { name, hosts } = item
    const cate = await cateDatabase.add({ name, autoRules: [] })
    const cateId = cate.id
    const siteKeys = hosts.map(host => ({ host, type: 'normal' } satisfies timer.site.SiteKey))
    await batchChangeCate(cateId, siteKeys)
}

export default class CateInitializer implements Migrator {
    async onInstall(): Promise<void> {
        for (const item of DEMO_ITEMS) {
            await initItem(item)
        }
    }

    onUpdate(_version: string): void {
    }
}