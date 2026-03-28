export type ModifyForm = Omit<timer.limit.Rule, 'id'> & {
    urlMiss?: boolean
}