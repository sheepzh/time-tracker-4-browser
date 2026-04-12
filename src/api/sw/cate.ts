import { sendMsg2Runtime } from "./common"

export const listAllCategories = () => sendMsg2Runtime('cate.all')
