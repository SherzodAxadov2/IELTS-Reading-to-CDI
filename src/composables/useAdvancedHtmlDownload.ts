import { ref } from 'vue'

interface DownloadOptions {
  filename?: string
  includeVue?: boolean
  preserveInteractivity?: boolean
  includeExternalAssets?: boolean
}

export function useAdvancedHtmlDownload() {
  const isDownloading = ref(false)

  const downloadPageWithFullFunctionality = async (
    options: DownloadOptions = {}
  ): Promise<void> => {
    const {
      filename = 'vue-page.html',
      includeVue = true,
      preserveInteractivity = true,
      includeExternalAssets = false,
    } = options

    try {
      isDownloading.value = true

      const htmlContent = await generateAdvancedHTML({
        includeVue,
        preserveInteractivity,
        includeExternalAssets,
      })

      downloadFile(htmlContent, filename)
    } catch (error) {
      console.error('Advanced download failed:', error)
      throw error
    } finally {
      isDownloading.value = false
    }
  }

  const generateAdvancedHTML = async (options: {
    includeVue: boolean
    preserveInteractivity: boolean
    includeExternalAssets: boolean
  }): Promise<string> => {
    const appElement = document.getElementById('app')
    if (!appElement) throw new Error('App element not found')

    // Collect all resources
    const [css, scripts] = await Promise.all([
      collectAllCSS(),
      options.preserveInteractivity ? collectScripts() : Promise.resolve(''),
    ])

    const processedHTML = processHTMLForStandalone(appElement.outerHTML)

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Downloaded Vue Page</title>
  ${options.includeVue ? '<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>' : ''}
  <style>${css}</style>
</head>
<body>
  <div id="downloaded-app">${processedHTML}</div>
  <script>${scripts}</script>
</body>
</html>`
  }

  const collectAllCSS = async (): Promise<string> => {
    let css = ''
    for (let i = 0; i < document.styleSheets.length; i++) {
      const styleSheet = document.styleSheets[i] as CSSStyleSheet
      try {
        const rules = styleSheet.cssRules
        if (rules) {
          for (let j = 0; j < rules.length; j++) {
            css += rules[j].cssText + '\n'
          }
        }
      } catch (e) {
        if (styleSheet.href) {
          try {
            const response = await fetch(styleSheet.href)
            css += (await response.text()) + '\n'
          } catch {
            console.warn('Could not fetch external stylesheet:', styleSheet.href)
          }
        }
      }
    }
    const styleTags = document.querySelectorAll('style')
    styleTags.forEach((tag) => (css += tag.textContent + '\n'))
    return css
  }

  const collectScripts = async (): Promise<string> => {
    let scripts = ''
    const scriptTags = document.querySelectorAll('script:not([src])')
    scriptTags.forEach((script) => {
      const content = script.textContent || ''
      if (!content.includes('createApp') && !content.includes('Vue.createApp')) {
        scripts += content + '\n'
      }
    })
    return scripts
  }

  const processHTMLForStandalone = (html: string): string => {
    const currentOrigin = window.location.origin
    html = html.replace(/src="\/(.*?)"/g, `src="${currentOrigin}/$1"`)
    html = html.replace(/href="\/(.*?)"/g, `href="${currentOrigin}/$1"`)
    html = html.replace(/url\(\/(.*?)\)/g, `url(${currentOrigin}/$1)`)
    html = html.replace(/v-[a-z-]+="[^"]*"/g, '')
    html = html.replace(/@[a-z-]+="[^"]*"/g, '')
    html = html.replace(/:([a-z-]+)="[^"]*"/g, '$1')
    return html
  }

  const downloadFile = (content: string, filename: string): void => {
    const blob = new Blob([content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return { isDownloading, downloadPageWithFullFunctionality }
}
