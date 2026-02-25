import cateService from "@service/cate-service"
import { batchSaveSiteCate } from "@service/site-service"
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
    const cate = await cateService.add(name)
    const cateId = cate.id
    const siteKeys = hosts.map(host => ({ host, type: 'normal' } satisfies timer.site.SiteKey))
    await batchSaveSiteCate(cateId, siteKeys)
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