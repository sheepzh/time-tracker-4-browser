import { keyOf } from "@/background/util/period"
import { getBirthday, getStartOfDay, MILL_PER_DAY } from "@util/time"
import alarmManager from "./alarm-manager"
import { batchDeletePeriods } from "./service/period-service"

const PERIOD_ALARM_NAME = 'period-cleaner-alarm'
const START_DAY = keyOf(getBirthday())
const KEEP_RANGE_DAYS = 366

const cleanPeriodData = async () => {
    const endDate = Date.now() - MILL_PER_DAY * KEEP_RANGE_DAYS
    await batchDeletePeriods(START_DAY, keyOf(endDate))
}

export default function initDataCleaner() {
    alarmManager.setWhen(
        PERIOD_ALARM_NAME,
        () => getStartOfDay(new Date()) + MILL_PER_DAY,
        cleanPeriodData,
    )
}