import periodService, { type PeriodQueryParam } from "@service/period-service"
import { keyOf } from "@util/period"
import { getBirthday, getStartOfDay, MILL_PER_DAY } from "@util/time"
import alarmManager from "./alarm-manager"

const PERIOD_ALARM_NAME = 'period-cleaner-alarm'
const START_DAY = keyOf(getBirthday())
const KEEP_RANGE_DAYS = 366

const cleanPeriodData = async () => {
    const endDate = new Date().getTime() - MILL_PER_DAY * KEEP_RANGE_DAYS
    const param: PeriodQueryParam = { periodRange: [START_DAY, keyOf(endDate)] }
    await periodService.batchDeleteBetween(param)
}

export default function initDataCleaner() {
    alarmManager.setWhen(
        PERIOD_ALARM_NAME,
        () => getStartOfDay(new Date()) + MILL_PER_DAY,
        cleanPeriodData,
    )
}