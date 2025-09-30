import { RsdoctorRspackPlugin } from "@rsdoctor/rspack-plugin"
import option from "./rspack.prod"
import { enhancePluginWith } from './util'

enhancePluginWith(option, new RsdoctorRspackPlugin())

export default option