import { mockStorage } from "../../__mock__/storage"

let calcTimeState: (item: timer.limit.Item, reminderMills: number, delayDuration: number) => {
    daily: 'NORMAL' | 'REMINDER' | 'LIMITED'
    weekly: 'NORMAL' | 'REMINDER' | 'LIMITED'
}

beforeAll(async () => {
    mockStorage()
    Object.assign(global.chrome as object, {
        runtime: {
            id: "test",
            getManifest: () => ({ manifest_version: 3 }),
        },
    })
    const mod = await import("@/background/service/limit-service")
    calcTimeState = mod.calcTimeState
})

describe("background/limit-service", () => {
    test("calcTimeState", () => {
        const item: timer.limit.Item = {
            id: 1,
            name: "foobar",
            cond: [],
            time: 10,
            weekly: 10,
            waste: 0,
            visit: 0,
            delayCount: 0,
            weeklyWaste: 0,
            weeklyVisit: 0,
            weeklyDelayCount: 0,
            enabled: true,
            allowDelay: false,
            locked: false,
        }
        const duration = 1000

        type LimitState = "NORMAL" | "REMINDER" | "LIMITED"

        const assert = (daily: LimitState, weekly: LimitState) => {
            const res = calcTimeState(item, duration, 5)
            expect(res?.daily).toBe(daily)
            expect(res?.weekly).toBe(weekly)
        }

        item.waste = 9000
        assert("NORMAL", "NORMAL")

        item.waste = 9001
        assert("REMINDER", "NORMAL")

        item.waste = 10001
        assert("LIMITED", "NORMAL")

        item.allowDelay = true
        item.delayCount = 1

        item.weeklyWaste = 9000
        assert("NORMAL", "NORMAL")
        item.weeklyWaste = 9001
        assert("NORMAL", "REMINDER")
        item.weeklyWaste = 10001
        assert("NORMAL", "LIMITED")
    })
})
