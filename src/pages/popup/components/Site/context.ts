import { getCurrentSite } from '@api/sw/site'
import { localRef, useProvide, useProvider, useRequest } from '@hooks'
import { isNotTrackable } from '@util/constant/environment'
import { isSameSite } from '@util/site'
import { createStringUnionGuard } from 'typescript-guard'
import { computed, type Ref, shallowRef, type ShallowRef, watch } from 'vue'

export type SiteTab = 'calendar' | 'limit'
export const isSiteTab = createStringUnionGuard<SiteTab>('calendar', 'limit')

type SiteContext = {
    tab: Ref<SiteTab>
    url: Readonly<Ref<string | undefined>>
    refresh: NoArgCallback
    trackable: Readonly<Ref<boolean>>
    site: ShallowRef<tt4b.site.SiteInfo | undefined>
    sites: ShallowRef<tt4b.site.SiteInfo[]>
}

const initSite = (current: Ref<tt4b.site.Current | undefined>) => {
    const sites = computed(() => {
        if (!current.value) return []
        const { normal, others } = current.value
        return [normal, ...others]
    })
    const site = shallowRef<tt4b.site.SiteInfo | undefined>()
    watch(sites, val => {
        const oldV = site.value
        if (oldV) {
            if (!val.some(v => isSameSite(oldV, v))) site.value = undefined
        } else {
            site.value = val[0]
        }
    }, { immediate: true })
    return { site, sites }
}

const NAMESPACE = 'popup_site'

export const initSiteContext = () => {
    const tab = localRef<SiteTab>(`${NAMESPACE}-tab`, isSiteTab, 'calendar')
    const { data, loading, refresh } = useRequest(getCurrentSite)
    const url = computed(() => data.value?.url)
    const trackable = computed(() => !loading.value && !!url.value && !isNotTrackable(url.value))
    const { site, sites } = initSite(data)
    useProvide<SiteContext>(NAMESPACE, { tab, url, refresh, trackable, site, sites })
    return { tab, trackable }
}

export const useSite = () => useProvider<SiteContext, 'site' | 'refresh' | 'sites' | 'url' | 'trackable'>(
    NAMESPACE, 'site', 'refresh', 'sites', 'url', 'trackable',
)

export const useTab = () => useProvider<SiteContext, 'tab'>(NAMESPACE, 'tab').tab