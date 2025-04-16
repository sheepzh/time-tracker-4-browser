import { defineComponent } from "vue"
import "./installation-link.sass"

type _Source = 'chrome' | 'firefox' | 'edge' | 'kiwi'

const _default = defineComponent<{ source: _Source, name: string, href: string }>(({ source, name, href }) => {
    return () =>
        <div class="installation-link-container">
            <a href={href} target="_blank" class="installation-link">
                <div class={`i-logos i-logos-${source}`} />
                <span class="installation-name">{name}</span>
            </a>
        </div>
}, { props: ['source', 'name', 'href'] })

export default _default