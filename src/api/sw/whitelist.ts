import { sendMsg2Runtime } from "./common"

export const listWhitelist = () => sendMsg2Runtime('whitelist.all')

export const addWhitelist = (white: string) => sendMsg2Runtime('whitelist.add', white)

export const deleteWhitelist = (white: string) => sendMsg2Runtime('whitelist.delete', white)
