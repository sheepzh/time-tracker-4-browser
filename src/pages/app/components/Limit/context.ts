import { getOption } from '@/api/sw/option'
import { DEFAULT_LIMIT } from '@/util/constant/option'
import { deleteLimits, listLimits, updateLimits } from "@api/sw/limit"
import { t } from '@app/locale'
import type { LimitQuery } from '@app/router/constants'
import { judgeVerificationRequired, processVerification } from '@app/util/limit'
import { useDocumentVisibility, useManualRequest, useProvide, useProvider, useRequest } from '@hooks'
import { tryParseInteger } from '@util/number'
import { ElMessage, ElMessageBox } from "element-plus"
import { computed, onMounted, reactive, ref, toRaw, watch, type ShallowRef } from "vue"
import { useRoute, useRouter } from 'vue-router'
import type { LimitFilterOption, ModifyInstance, TestInstance } from "./types"

type Context = {
    filter: LimitFilterOption
    list: ShallowRef<tt4b.limit.Item[]>
    selected: ShallowRef<tt4b.limit.Item[]>
    refresh: NoArgCallback
    batchDelete: NoArgCallback
    batchEnable: NoArgCallback
    batchDisable: NoArgCallback
    changeEnabled: (item: tt4b.limit.Item, val: boolean) => Promise<void>
    changeDelay: (item: tt4b.limit.Item, val: boolean) => Promise<void>
    changeLocked: (item: tt4b.limit.Item, val: boolean) => Promise<void>
    modify: ArgCallback<tt4b.limit.Item>
    remove: ArgCallback<tt4b.limit.Item>
    create: () => void
    test: () => void
    empty: ShallowRef<boolean>
    delayDuration: ShallowRef<number>
}

const NAMESPACE = 'limit'

const initialQuery = () => {
    const { url, action, id: idQuery } = useRoute().query as LimitQuery
    useRouter().replace({ query: {} })
    const [isNum, idMaybe] = idQuery ? tryParseInteger(idQuery) : [false, undefined]
    return {
        url: url && decodeURIComponent(url),
        action,
        id: isNum && !Number.isNaN(idMaybe) && idMaybe ? idMaybe : undefined,
    }
}

const batchJudge = async (items: tt4b.limit.Item[]): Promise<boolean> => {
    if (!items?.length) return false
    const { limitDelayDuration, limitLevel } = await getOption()
    for (const item of items) {
        if (!item) continue
        let needVerify = await judgeVerificationRequired(item, limitDelayDuration)
        // If locked and the level is not strict, verification is also required to modify the rule
        if (limitLevel !== 'strict') needVerify ||= item.locked
        if (needVerify) return true
    }
    return false
}

const verifyCanModify = async (...items: tt4b.limit.Item[]) => {
    const needVerify = await batchJudge(items)
    if (!needVerify) return

    // Open delay for limited rules, so verification is required
    const option = await getOption()
    if (!option) return
    await processVerification(option)
}

export const initLimitContext = () => {
    const { url, action, id } = initialQuery()
    let modifyTriggered = false
    const initialUrl = action === 'create' ? undefined : url

    if (action === 'create') {
        onMounted(() => setTimeout(() => modifyInst.value?.create(url)))
    }

    const filter = reactive<LimitFilterOption>({ url: initialUrl, effective: false })

    const { data: list, refresh, loading } = useRequest(
        () => listLimits({ url: filter.url, effective: filter.effective }),
        {
            defaultValue: [],
            deps: [() => filter.url, () => filter.effective],
            onSuccess: data => {
                if (action !== 'modify' || modifyTriggered) return
                const target = data.find(i => i.id === id)
                target && setTimeout(() => modifyInst.value?.modify(target))
                modifyTriggered = true
            }
        },
    )

    const { data: delayDuration } = useRequest(
        () => getOption().then(o => o.limitDelayDuration),
        { defaultValue: DEFAULT_LIMIT.limitDelayDuration },
    )

    // Query data if the window become visible
    const docVisible = useDocumentVisibility()
    watch(docVisible, () => docVisible.value && refresh())

    const { refresh: remove } = useManualRequest(async (row: tt4b.limit.Item) => {
        await verifyCanModify(row)
        const message = t(msg => msg.limit.message.deleteConfirm, { name: row.name })
        await ElMessageBox.confirm(message)
        await deleteLimits([row.id])
    }, {
        onSuccess() {
            ElMessage.success(t(msg => msg.operation.successMsg))
            refresh()
        }
    })

    const selected = ref<tt4b.limit.Item[]>([])

    const selectedAndThen = (then: (list: tt4b.limit.Item[]) => void): void => {
        const list = selected.value
        if (!list.length) return void ElMessage.info('No limit rule selected')
        then(list)
    }

    const onBatchSuccess = () => {
        ElMessage.success(t(msg => msg.operation.successMsg))
        refresh()
    }

    const handleBatchDelete = (list: tt4b.limit.Item[]) => {
        const names = list.map(item => item.name ?? item.id).join(', ')
        verifyCanModify(...list)
            .then(() => ElMessageBox.confirm(t(msg => msg.limit.message.deleteConfirm, { name: names }), { type: "warning" }))
            .then(() => deleteLimits(list.map(item => item.id)))
            .then(onBatchSuccess)
            .catch(() => { })
    }

    const handleBatchEnable = (list: tt4b.limit.Item[]) => {
        list.forEach(item => item.enabled = true)
        updateLimits(list).then(onBatchSuccess).catch(() => { })
    }

    const handleBatchDisable = (list: tt4b.limit.Item[]) => verifyCanModify(...list)
        .then(() => {
            list.forEach(item => item.enabled = false)
            return updateLimits(list)
        })
        .then(onBatchSuccess)
        .catch(() => { })

    const changeEnabled = async (row: tt4b.limit.Item, newVal: boolean) => {
        try {
            // Only verify when disabling, ignore lock state
            !newVal && await verifyCanModify(row)
            row.enabled = newVal
            await updateLimits([toRaw(row)])
        } catch (e) {
            console.info(e)
        }
    }

    const changeDelay = async (row: tt4b.limit.Item, newVal: boolean) => {
        try {
            (row.locked || newVal) && await verifyCanModify(row)
            row.allowDelay = newVal
            await updateLimits([toRaw(row)])
        } catch (e) {
            console.warn(e)
        }
    }

    const changeLocked = async (row: tt4b.limit.Item, newVal: boolean) => {
        try {
            if (newVal) {
                const msg = t(msg => msg.limit.message.lockConfirm)
                await ElMessageBox.confirm(msg, { type: 'warning' })
            } else {
                await verifyCanModify(row)
            }
            row.locked = newVal
            await updateLimits([toRaw(row)])
        } catch (e) {
            console.warn(e)
        }
    }

    const modifyInst = ref<ModifyInstance>()
    const testInst = ref<TestInstance>()
    const modify = (row: tt4b.limit.Item) => verifyCanModify(row)
        .then(() => modifyInst.value?.modify?.(toRaw(row)))
        .catch(() => {/** Do nothing */ })
    const create = () => modifyInst.value?.create?.()
    const test = () => testInst.value?.show?.()
    const empty = computed(() => !loading.value && !(list.value?.length))

    useProvide<Context>(NAMESPACE, {
        filter, list, selected, empty, refresh, delayDuration,
        remove, modify, create, test, changeEnabled, changeDelay, changeLocked,
        batchDelete: () => selectedAndThen(handleBatchDelete),
        batchEnable: () => selectedAndThen(handleBatchEnable),
        batchDisable: () => selectedAndThen(handleBatchDisable),
    })

    return { modifyInst, testInst }
}

export const useLimitFilter = (): LimitFilterOption => useProvider<Context, 'filter'>(NAMESPACE, "filter").filter

export const useLimitData = () => useProvider<Context, 'list' | 'selected' | 'refresh' | 'changeEnabled' | 'changeDelay' | 'changeLocked'>(
    NAMESPACE, 'list', 'selected', 'refresh', 'changeEnabled', 'changeDelay', 'changeLocked'
)

export const useLimitBatch = () => useProvider<Context, 'batchDelete' | 'batchEnable' | 'batchDisable'>(
    NAMESPACE, 'batchDelete', 'batchEnable', 'batchDisable'
)

export const useLimitAction = () => useProvider<Context, 'test' | 'remove' | 'modify' | 'create' | 'empty'>(NAMESPACE, 'remove', 'modify', 'test', 'create', 'empty')

export const useDelayDuration = () => useProvider<Context, 'delayDuration'>(NAMESPACE, 'delayDuration').delayDuration