import { APP_SITE_ROUTE } from '@/shared/route'
import { createTab } from '@api/chrome/tab'
import { addSite, listSites } from '@api/sw/site'
import { ArrowDown, Check, CirclePlus, EditPen } from '@element-plus/icons-vue'
import { useOperation, useRequest, useSwitch } from '@hooks'
import { Asterisk, Merge, Website } from '@pages/icons'
import { t } from '@popup/locale'
import { getAppPageUrl } from '@util/constant/url'
import { extractHostname } from '@util/pattern'
import { isSameSite } from '@util/site'
import {
    ElButton, ElDialog, ElDropdown, ElDropdownItem, ElDropdownMenu, ElIcon, ElOption, ElSelect, type SelectInstance,
    useLocale,
} from 'element-plus'
import { type Component, computed, defineComponent, ref, type Ref } from 'vue'
import { useSite } from '../context'

type Data = {
    existed: boolean
    url: string
}

const recommendSubpages = (url: string | undefined, existed: string[]): Data[] => {
    if (!url) return []

    try {
        let { host, pathname } = new URL(url)
        if (pathname.endsWith('/')) pathname = pathname.slice(0, -1)
        if (!pathname) return []
        const urls = [`${host}${pathname}`]
        const segments = pathname.split('/').filter(Boolean)
        while (segments.pop()) {
            segments.length && urls.push(`${host}/${segments.join('/')}/**`)
        }
        const results = urls.map(url => ({ url, existed: existed.some(e => e === url) }))
        return results.sort((a, b) => a.existed === b.existed ? 0 : a.existed ? 1 : -1)
    } catch {
        return []
    }
}

const useDropdown = (options: { url: Ref<string | undefined>, onSave: NoArgCallback }) => {
    const { url, onSave } = options
    const { data: existed, refresh } = useRequest(async () => {
        const v = url.value
        if (!v) return []
        const { host, protocol } = extractHostname(v)
        if (protocol === 'file') return []
        if (!host) return []
        const list = await listSites({ fuzzyQuery: host, types: ['virtual'] })
        return list.filter(s => s.host.startsWith(`${host}/`) && s.type === 'virtual').map(s => s.host)
    }, { deps: [url], defaultValue: [] })

    const subpages = computed(() => recommendSubpages(url.value, existed.value))

    const [visible, open_, close] = useSwitch(false)
    const subpage = ref<string>()
    const saveSubpage = useOperation(async () => {
        const host = subpage.value
        if (!host) return false
        await addSite({ host, type: 'virtual' })
    }, {
        onSuccess: () => {
            refresh()
            close()
            onSave()
        }
    })

    const select = ref<SelectInstance>()

    const open = () => {
        subpage.value = undefined
        open_()
    }

    return { select, subpages, subpage, visible, open, close, saveSubpage }
}

const DROP_ITEM_ICONS: Record<tt4b.site.Type, Component> = {
    normal: Website,
    merged: Merge,
    virtual: Asterisk,
}

const Dropdown = defineComponent<{}>(() => {
    const { site, sites, url, trackable, refresh } = useSite()
    const { select, subpages, subpage, visible, open, close, saveSubpage } = useDropdown({ url, onSave: refresh })
    const { t: tEle } = useLocale()
    const handleEditSite = async () => {
        const appUrl = getAppPageUrl(APP_SITE_ROUTE)
        await createTab(appUrl)
    }

    return () => <>
        <ElDropdown
            v-show={trackable.value}
            v-slots={{
                default: () => <ElIcon><ArrowDown /></ElIcon>,
                dropdown: () => (
                    <ElDropdownMenu>
                        {sites.value.map(s => (
                            <ElDropdownItem
                                onClick={() => site.value = s}
                                disabled={isSameSite(s, site.value)}
                                icon={DROP_ITEM_ICONS[s.type]}
                            >
                                {s.host}{s.type === 'normal' ? '' : ` [${t(msg => msg.shared.site.type[s.type])}]`}
                            </ElDropdownItem>
                        ))}
                        <ElDropdownItem divided icon={CirclePlus} onClick={open}>
                            {t(msg => msg.content.site.subpageBtn)}
                        </ElDropdownItem>
                        <ElDropdownItem icon={EditPen} onClick={handleEditSite}>
                            {t(msg => msg.base.sites)}
                        </ElDropdownItem>
                    </ElDropdownMenu>
                ),
            }}
        />
        <ElDialog
            width={400}
            title={t(msg => msg.content.site.subpageBtn)}
            modelValue={visible.value}
            closeOnClickModal={false}
            style={{ textAlign: 'left' }}
            onClose={close}
            onOpened={() => select.value?.toggleMenu()}
            v-slots={{
                footer: () => (
                    <ElButton
                        type='primary' nativeType='submit'
                        icon={Check}
                        size='small'
                        onClick={saveSubpage}
                    >
                        {tEle('el.messagebox.confirm')}
                    </ElButton>
                )
            }}
        >
            <ElSelect
                ref={select}
                modelValue={subpage.value}
                placement='bottom'
                onChange={v => subpage.value = v}
            >
                {subpages.value.map(({ url, existed }) => <ElOption label={url} value={url} disabled={existed} />)}
            </ElSelect>
        </ElDialog>
    </>
})

export default Dropdown