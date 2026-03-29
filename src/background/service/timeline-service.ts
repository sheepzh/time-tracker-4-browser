/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { toMap } from '@/util/array'
import { CATE_NOT_SET_ID } from '@/util/site'
import mergeDb from '@db/merge-rule-database'
import cateDb from "@db/site-cate-database"
import siteDb from "@db/site-database"
import db from "@db/timeline-database"
import CustomizedHostMergeRuler from './components/host-merge-ruler'

export async function listTimeline(query: timer.timeline.Query): Promise<timer.timeline.Activity[]> {
    const ticks = await db.select(query)
    const { merge } = query
    if (merge === 'domain') {
        return mergeByDomain(ticks)
    } else if (merge === 'cate') {
        return mergeByCate(ticks)
    } else {
        return fillSiteName(ticks)
    }
}

async function mergeByDomain(ticks: timer.timeline.Tick[]): Promise<timer.timeline.Activity[]> {
    const mergeRules = await mergeDb.selectAll()
    const merger = new CustomizedHostMergeRuler(mergeRules)
    const allHosts = Array.from(new Set(ticks.map(t => t.host)))
    const mergedMap = toMap(allHosts, h => h, h => merger.merge(h))

    const allSiteKeys = Array.from(new Set(Object.values(mergedMap)))
        .map((mergedHost) => ({ type: 'merged', host: mergedHost } satisfies timer.site.SiteKey))
    const allSites = await siteDb.getBatch(allSiteKeys)
    const nameMap = toMap(allSites, s => s.host, s => s.alias)

    return ticks.map(({ start, duration, host }) => {
        const seriesKey = mergedMap[host] ?? host
        return {
            start, duration,
            seriesKey, seriesName: nameMap[seriesKey],
        }
    })
}

async function mergeByCate(ticks: timer.timeline.Tick[]): Promise<timer.timeline.Activity[]> {
    const cates = await cateDb.listAll()
    const cateNameMap = toMap(cates, c => c.id, c => c.name)
    const allSiteKeys = Array.from(new Set(ticks.map(t => t.host)))
        .map(host => ({ type: 'normal', host } satisfies timer.site.SiteKey))
    const allSites = await siteDb.getBatch(allSiteKeys)
    const siteCateMap = toMap(allSites, s => s.host, s => s.cate)

    return ticks.map(({ start, duration, host }) => {
        const cateId = siteCateMap[host] ?? CATE_NOT_SET_ID
        return {
            start, duration,
            seriesKey: `${cateId}`,
            seriesName: cateNameMap[cateId],
        }
    })
}

async function fillSiteName(ticks: timer.timeline.Tick[]): Promise<timer.timeline.Activity[]> {
    const allSiteKeys = Array.from(new Set(ticks.map(t => t.host)))
        .map(host => ({ type: 'normal', host } satisfies timer.site.SiteKey))
    const allSites = await siteDb.getBatch(allSiteKeys)
    const nameMap = toMap(allSites, s => s.host, s => s.alias)

    return ticks.map(({ start, duration, host }) => ({
        start, duration,
        seriesKey: host, seriesName: nameMap[host],
    }))
}
