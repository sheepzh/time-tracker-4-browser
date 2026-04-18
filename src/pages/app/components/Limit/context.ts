import { getOption } from '@/api/sw/option'
import { DEFAULT_LIMIT } from '@/util/constant/option'
import { deleteLimits, listLimits, updateLimits } from "@api/sw/limit"
import { t } from '@app/locale'
import type { LimitQuery } from '@app/router/constants'
import { useDocumentVisibility, useManualRequest, useProvide, useProvider, useRequest } from '@hooks'
import { ElMessage, ElMessageBox } from "element-plus"
import { computed, reactive, ref, toRaw, watch, type ShallowRef } from "vue"
import { useRoute, useRouter } from "vue-router"
import { verifyCanModify } from "./common"
import type { LimitFilterOption, LimitInstance, ModifyInstance, TestInstance } from "./types"

type Context = {
    filter: LimitFilterOption
    list: ShallowRef<timer.limit.Item[]>
    refresh: NoArgCallback
    deleteRow: ArgCallback<timer.limit.Item>
    batchDelete: NoArgCallback
    batchEnable: NoArgCallback
    batchDisable: NoArgCallback
    changeEnabled: (item: timer.limit.Item, val: boolean) => Promise<void>
    changeDelay: (item: timer.limit.Item, val: boolean) => Promise<void>
    changeLocked: (item: timer.limit.Item, val: boolean) => Promise<void>
    modify: (item: timer.limit.Item) => void
    create: () => void
    test: () => void
    empty: ShallowRef<boolean>
    delayDuration: ShallowRef<number>
}

const NAMESPACE = 'limit'

const initialUrl = () => {
    // Init with url parameter
    const { url } = useRoute().query as LimitQuery
    useRouter().replace({ query: {} })
    return url && decodeURIComponent(url)
}

export const useLimitProvider = () => {
    const filter = reactive<LimitFilterOption>({ url: initialUrl(), enabled: false })

    const { data: list, refresh, loading } = useRequest(
        () => listLimits({ enabled: filter.enabled, url: filter.url }),
        {
            defaultValue: [],
            deps: [() => filter.url, () => filter.enabled],
        },
    )

    const { data: delayDuration } = useRequest(
        () => getOption().then(o => o.limitDelayDuration),
        { defaultValue: DEFAULT_LIMIT.limitDelayDuration },
    )

    // Query data if the window become visible
    const docVisible = useDocumentVisibility()
    watch(docVisible, () => docVisible.value && refresh())

    const { refresh: deleteRow } = useManualRequest(async (row: timer.limit.Item) => {
        await verifyCanModify(row)
        const message = t(msg => msg.limit.message.deleteConfirm, { name: row.name })
        await ElMessageBox.confirm(message, { type: "warning" })
        await deleteLimits([row.id])
    }, {
        onSuccess() {
            ElMessage.success(t(msg => msg.operation.successMsg))
            refresh()
        }
    })

    const inst = ref<LimitInstance>()

    const selectedAndThen = (then: (list: timer.limit.Item[]) => void): void => {
        const list = inst.value?.getSelected?.()
        if (!list?.length) {
            ElMessage.info('No limit rule selected')
            return
        }
        then(list)
    }

    const onBatchSuccess = () => {
        ElMessage.success(t(msg => msg.operation.successMsg))
        refresh()
    }

    const handleBatchDelete = (list: timer.limit.Item[]) => {
        const names = list.map(item => item.name ?? item.id).join(', ')
        verifyCanModify(...list)
            .then(() => ElMessageBox.confirm(t(msg => msg.limit.message.deleteConfirm, { name: names }), { type: "warning" }))
            .then(() => deleteLimits(list.map(item => item.id)))
            .then(onBatchSuccess)
            .catch(() => { })
    }

    const handleBatchEnable = (list: timer.limit.Item[]) => {
        list.forEach(item => item.enabled = true)
        updateLimits(list).then(onBatchSuccess).catch(() => { })
    }

    const handleBatchDisable = (list: timer.limit.Item[]) => verifyCanModify(...list)
        .then(() => {
            list.forEach(item => item.enabled = false)
            return updateLimits(list)
        })
        .then(onBatchSuccess)
        .catch(() => { })

    const changeEnabled = async (row: timer.limit.Item, newVal: boolean) => {
        const enabled = !!newVal
        try {
            (row.locked || !enabled) && await verifyCanModify(row)
            row.enabled = enabled
            await updateLimits([toRaw(row)])
        } catch (e) {
            console.warn(e)
        }
    }

    const changeDelay = async (row: timer.limit.Item, newVal: boolean) => {
        const allowDelay = !!newVal
        try {
            (row.locked || allowDelay) && await verifyCanModify(row)
            row.allowDelay = allowDelay
            await updateLimits([toRaw(row)])
        } catch (e) {
            console.warn(e)
        }
    }

    const changeLocked = async (row: timer.limit.Item, newVal: boolean) => {
        const locked = !!newVal
        try {
            if (locked) {
                const msg = t(msg => msg.limit.message.lockConfirm)
                await ElMessageBox.confirm(msg, { type: 'warning' })
            } else {
                await verifyCanModify(row)
            }
            row.locked = locked
            await updateLimits([toRaw(row)])
        } catch (e) {
            console.warn(e)
        }
    }

    const modifyInst = ref<ModifyInstance>()
    const testInst = ref<TestInstance>()
    const modify = (row: timer.limit.Item) => modifyInst.value?.modify?.(toRaw(row))
    const create = () => modifyInst.value?.create?.()
    const test = () => testInst.value?.show?.()
    const empty = computed(() => !loading.value && !(list.value?.length))

    useProvide<Context>(NAMESPACE, {
        filter, list, empty, refresh, delayDuration,
        deleteRow, modify, create, test, changeEnabled, changeDelay, changeLocked,
        batchDelete: () => selectedAndThen(handleBatchDelete),
        batchEnable: () => selectedAndThen(handleBatchEnable),
        batchDisable: () => selectedAndThen(handleBatchDisable),
    })

    return { modifyInst, testInst, inst }
}

export const useLimitFilter = (): LimitFilterOption => useProvider<Context, 'filter'>(NAMESPACE, "filter").filter

export const useLimitData = () => useProvider<Context, 'list' | 'refresh' | 'deleteRow' | 'changeEnabled' | 'changeDelay' | 'changeLocked'>(
    NAMESPACE, 'list', 'refresh', 'deleteRow', 'changeEnabled', 'changeDelay', 'changeLocked'
)

export const useLimitBatch = () => useProvider<Context, 'batchDelete' | 'batchEnable' | 'batchDisable'>(
    NAMESPACE, 'batchDelete', 'batchDisable', 'batchEnable'
)

export const useLimitAction = () => useProvider<Context, 'test' | 'modify' | 'create' | 'empty'>(NAMESPACE, 'modify', 'test', 'create', 'empty')

export const useDelayDuration = () => useProvider<Context, 'delayDuration'>(NAMESPACE, 'delayDuration').delayDuration