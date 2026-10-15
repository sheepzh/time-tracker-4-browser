import { dateFmt } from '@app/locale'

export const formatYAxis = (date: Date | number) => dateFmt({ month: "2-digit", day: "2-digit" }).format(date)