import {
    batchRemoveLimitRules, batchUpdateEnabled, selectLimits, updateDelay, updateLocked,
} from "@api/sw/limit"
import { t } from '@app/locale'
import { type LimitQuery } from '@app/router/constants'
import { useDocumentVisibility, useManualRequest, useProvide, useProvider, useRequest } from '@hooks'
import { ElMessage, ElMessageBox } from "element-plus"
import { computed, reactive, ref, toRaw, watch, type Reactive, type Ref } from "vue"
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

export type LimitInstance = {
    getSelected(): timer.limit.Item[]
}

type Context = {
    filter: Reactive<LimitFilterOption>
    list: Ref<timer.limit.Item[]>
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
    empty: Ref<boolean>
}

const NAMESPACE = 'limit'

const initialUrl = () => {
    // Init with url parameter
    const { url } = useRoute().query as LimitQuery
    useRouter().replace({ query: {} })
    return url && decodeURIComponent(url)
}

export const useLimitProvider = () => {
    const filter = reactive<LimitFilterOption>({ url: initialUrl(), onlyEnabled: false })

    const { data: list, refresh, loading } = useRequest(
        () => selectLimits({ filterDisabled: filter.onlyEnabled, url: filter.url }),
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
        await batchRemoveLimitRules([row])
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
            .then(() => batchRemoveLimitRules(list))
            .then(onBatchSuccess)
            .catch(() => { })
    }

    const handleBatchEnable = (list: timer.limit.Item[]) => {
        list.forEach(item => item.enabled = true)
        batchUpdateEnabled(list).then(onBatchSuccess).catch(() => { })
    }

    const handleBatchDisable = (list: timer.limit.Item[]) => verifyCanModify(...list)
        .then(() => {
            list.forEach(item => item.enabled = false)
            return batchUpdateEnabled(list)
        })
        .then(onBatchSuccess)
        .catch(() => { })

    const changeEnabled = async (row: timer.limit.Item, newVal: boolean) => {
        const enabled = !!newVal
        try {
            (row.locked || !enabled) && await verifyCanModify(row)
            row.enabled = enabled
            await batchUpdateEnabled([toRaw(row)])
        } catch (e) {
            console.warn(e)
        }
    }

    const changeDelay = async (row: timer.limit.Item, newVal: boolean) => {
        const allowDelay = !!newVal
        try {
            (row.locked || allowDelay) && await verifyCanModify(row)
            row.allowDelay = allowDelay
            await updateDelay(toRaw(row))
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
            await updateLocked(toRaw(row))
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
        filter,
        list: list as Ref<timer.limit.Item[]>, empty, refresh,
        deleteRow,
        batchDelete: () => selectedAndThen(handleBatchDelete),
        batchEnable: () => selectedAndThen(handleBatchEnable),
        batchDisable: () => selectedAndThen(handleBatchDisable),
        changeEnabled, changeDelay, changeLocked,
        modify, create, test,
    })

    return { modifyInst, testInst, inst }
}

export const useLimitFilter = (): Reactive<LimitFilterOption> => useProvider<Context, 'filter'>(NAMESPACE, "filter").filter

export const useLimitData = () => useProvider<Context, 'list' | 'refresh' | 'deleteRow' | 'changeEnabled' | 'changeDelay' | 'changeLocked'>(
    NAMESPACE, 'list', 'refresh', 'deleteRow', 'changeEnabled', 'changeDelay', 'changeLocked'
)

export const useLimitBatch = () => useProvider<Context, 'batchDelete' | 'batchEnable' | 'batchDisable'>(
    NAMESPACE, 'batchDelete', 'batchDisable', 'batchEnable'
)

export const useLimitAction = () => useProvider<Context, 'test' | 'modify' | 'create' | 'empty'>(NAMESPACE, 'modify', 'test', 'create', 'empty')