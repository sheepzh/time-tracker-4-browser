/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import packageJson from "../../../package.json"

type _AllPackageInfo = typeof packageJson
// The declaration of package.json
type _PackageInfo = Pick<_AllPackageInfo, 'name' | 'description' | 'version' | 'homepage' | 'author'>

const _default: _PackageInfo = {
    name: packageJson.name,
    description: packageJson.description,
    version: packageJson.version,
    homepage: packageJson.homepage,
    author: packageJson.author
}

/**
 * @since 1.8.0
 */
export const AUTHOR_EMAIL: string = packageJson.author.email

export default _default