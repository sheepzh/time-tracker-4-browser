import { type RequestOption, type RequestResult, useRequest } from './useRequest'

export function useManualRequest<P extends any[], T>(
    getter: (...p: P) => Awaitable<T>,
    option: MakeRequired<Omit<RequestOption<T, P>, 'manual'>, 'defaultValue'>,
): RequestResult<T, P>
export function useManualRequest<P extends any[], T>(
    getter: (...p: P) => Awaitable<T | undefined>,
    option?: Omit<RequestOption<T, P>, 'manual'>,
): RequestResult<T | undefined, P>

export function useManualRequest<P extends any[], T>(
    getter: (...p: P) => Promise<T> | T,
    option?: Omit<RequestOption<T, P>, 'manual'>,
): RequestResult<T | undefined, P> {
    return useRequest(getter, { ...option || {}, manual: true })
}