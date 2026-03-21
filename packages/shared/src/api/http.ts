type Option = Omit<RequestInit, "method" | "body">

export type FetchResult<T> = {
    data?: T
    statusCode: number
}

export async function fetchGetWithTry(url: string, maxTry: number, option?: Option): Promise<Response> {
    let count = 0
    do {
        count++
        try {
            return await fetch(url, { ...option, method: "GET" })
        } catch (e) {
            console.error(`Failed to fetch get: url=${url}, tryCnt=${count}, err=${e}`)
        }
    } while (count < maxTry)
    throw Error(`Unable to obtain within the maximum number of attempts: url=${url}, maxCnt=${maxTry}`)
}

export async function fetchGet(url: string, option?: Option): Promise<Response> {
    try {
        const response = await fetch(url, {
            ...(option || {}),
            method: "GET",
        })
        return response
    } catch (e) {
        console.error("Failed to fetch get", e)
        throw Error(e?.toString?.() ?? 'Unknown error')
    }
}

export async function fetchPost<T>(url: string, body?: T, option?: Option): Promise<Response> {
    try {
        const response = await fetch(url, {
            ...(option || {}),
            method: "POST",
            body: body ? JSON.stringify(body) : null,
        })
        return response
    } catch (e) {
        console.error("Failed to fetch post", e)
        throw Error(e?.toString?.() ?? 'Unknown error')
    }
}

export async function fetchPutText(url: string, bodyText?: string, option?: Option): Promise<Response> {
    try {
        const response = await fetch(url, {
            ...(option || {}),
            method: "PUT",
            body: bodyText,
        })
        return response
    } catch (e) {
        console.error("Failed to fetch putText", e)
        throw Error(e?.toString?.() ?? 'Unknown error')
    }
}

export async function fetchDelete(url: string, option?: Option): Promise<Response> {
    try {
        const response = await fetch(url, {
            ...(option || {}),
            method: "DELETE",
        })
        return response
    } catch (e) {
        console.error("Failed to fetch delete", e)
        throw Error(e?.toString?.() ?? 'Unknown error')
    }
}