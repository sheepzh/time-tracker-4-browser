import { t } from '@/pages/app/locale'
import { formatTime } from '@/util/time'

const MONTH_DATE_FORMAT = t(msg => msg.calendar.monthDateFormat)
export const formatYAxis = (date: Date | number) => formatTime(date, MONTH_DATE_FORMAT)