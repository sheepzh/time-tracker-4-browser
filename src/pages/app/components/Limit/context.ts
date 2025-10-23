import { t } from "@app/locale"
import { useDocumentVisibility, useManualRequest, useProvide, useProvider, useRequest } from "@hooks"
import {
    removeLimitItem, selectLimitItems,
    updateLimitItemDelay, updateLimitItemEnabled, updateLimitItemLocked,
} from "@service/limit-service"
import { ElMessage, ElMessageBox, type TableInstance } from "element-plus"
import { Reactive, reactive, ref, toRaw, watch, type Ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { verifyCanModify } from "./common"
import type { LimitFilterOption } from "./types"

export type ModifyInstance = {
    create(): void
    modify(row: timer.limit.Item): void
}

export type TestInstance = {
    show(): void
}

type Context = {
    table: Ref<TableInstance | undefined>
    filter: Reactive<LimitFilterOption>
    list: Ref<timer.limit.Item[]>, refresh: NoArgCallback,
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
}

const NAMESPACE = 'limit'

const initialUrl = () => {
    // Init with url parameter
    const urlParam = useRoute().query['url'] as string
    useRouter().replace({ query: {} })
    return urlParam ? decodeURIComponent(urlParam) : ''
}

export const useLimitProvider = () => {
    const filter = reactive<LimitFilterOption>({ url: initialUrl(), onlyEnabled: false })

    const { data: list, refresh } = useRequest(
        () => selectLimitItems({ filterDisabled: filter.onlyEnabled, url: filter.url ?? '' }),
        {
            defaultValue: [],
            deps: [() => filter.url, () => filter.onlyEnabled],
        },
    )

    // Query data if the window become visible
    const docVisible = useDocumentVisibility()
    watch(docVisible, () => docVisible.value && refresh())

    const { refresh: deleteRow } = useManualRequest(async (row: timer.limit.Item) => {
        await verifyCanModify(row)
        const message = t(msg => msg.limit.message.deleteConfirm, { name: row.name })
        await ElMessageBox.confirm(message, { type: "warning" })
        await removeLimitItem(row)
    }, {
        onSuccess() {
            ElMessage.success(t(msg => msg.operation.successMsg))
            refresh()
        }
    })

    const table = ref<TableInstance>()

    const selectedAndThen = (then: (list: timer.limit.Item[]) => void): void => {
        const list = table.value?.getSelectionRows?.()
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

    const handleBatchDelete = (list: timer.limit.Item[]) => verifyCanModify(...list)
        .then(() => removeLimitItem(...list))
        .then(onBatchSuccess)
        .catch(() => { })

    const handleBatchEnable = (list: timer.limit.Item[]) => {
        list.forEach(item => item.enabled = true)
        updateLimitItemEnabled(...list).then(onBatchSuccess).catch(() => { })
    }

    const handleBatchDisable = (list: timer.limit.Item[]) => verifyCanModify(...list)
        .then(() => {
            list.forEach(item => item.enabled = false)
            return updateLimitItemEnabled(...list)
        })
        .then(onBatchSuccess)
        .catch(() => { })

    const changeEnabled = async (row: timer.limit.Item, newVal: boolean) => {
        const enabled = !!newVal
        try {
            (row.locked || !enabled) && await verifyCanModify(row)
            row.enabled = enabled
            await updateLimitItemEnabled(toRaw(row))
        } catch (e) {
            console.warn(e)
        }
    }

    const changeDelay = async (row: timer.limit.Item, newVal: boolean) => {
        const delayable = !!newVal
        try {
            (row.locked || delayable) && await verifyCanModify(row)
            row.allowDelay = delayable
            await updateLimitItemDelay(toRaw(row))
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
            await updateLimitItemLocked(toRaw(row))
        } catch (e) {
            console.warn(e)
        }
    }


    const modifyInst = ref<ModifyInstance>()
    const testInst = ref<TestInstance>()
    const modify = (row: timer.limit.Item) => modifyInst.value?.modify?.(toRaw(row))
    const create = () => modifyInst.value?.create?.()
    const test = () => testInst.value?.show?.()

    useProvide<Context>(NAMESPACE, {
        table,
        filter,
        list, refresh,
        deleteRow,
        batchDelete: () => selectedAndThen(handleBatchDelete),
        batchEnable: () => selectedAndThen(handleBatchEnable),
        batchDisable: () => selectedAndThen(handleBatchDisable),
        changeEnabled, changeDelay, changeLocked,
        modify, create, test,
    })

    return { modifyInst, testInst }
}

export const useLimitFilter = (): Reactive<LimitFilterOption> => useProvider<Context, 'filter'>(NAMESPACE, "filter").filter

export const useLimitTable = () => useProvider<Context, 'list' | 'table' | 'refresh' | 'deleteRow' | 'changeEnabled' | 'changeDelay' | 'changeLocked'>(
    NAMESPACE, 'list', 'table', 'refresh', 'deleteRow', 'changeEnabled', 'changeDelay', 'changeLocked'
)

export const useLimitBatch = () => useProvider<Context, 'batchDelete' | 'batchEnable' | 'batchDisable'>(
    NAMESPACE, 'batchDelete', 'batchDisable', 'batchEnable'
)

export const useLimitAction = () => useProvider<Context, 'test' | 'modify' | 'create'>(NAMESPACE, 'modify', 'test', 'create')