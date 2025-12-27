import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [
    Component.Comments({
      provider: 'giscus',
      options: {
        repo: 'ailelix/AilelixBlog',
        repoId: 'R_kgDOM5vYZQ',
        category: 'Announcements',
        categoryId: 'DIC_kwDOM5vYZc4Ci8zk',
        lightTheme: 'noborder_light',
        darkTheme: 'noborder_dark',
        themeUrl: 'https://giscus.app/themes/'
      }
    })
  ],
  footer: Component.Footer({
    links: {
      "CC BY-NC-SA 4.0": "https://creativecommons.org/licenses/by-nc-sa/4.0/",
      "Github": "https://github.com/ailelix",
      "X": "https://x.com/Ailllelllix",
      "友情链接": "https://blog.felixchen.uk/friendlinks"
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
    Component.MobileOnly(Component.TableOfContents())
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Search(),
    Component.Darkmode(),
    Component.DesktopOnly(Component.Explorer({
      filterFn: (node) => {
        return node.data?.tags?.includes("HIDE") !== true
      } // Filter out pages with "HIDE" tags in Explorer
    }))
  ],
  right: [
    Component.MobileOnly(Component.Explorer({
      filterFn: (node) => {
        return node.data?.tags?.includes("HIDE") !== true
      } // Same as above
    })),
    Component.DesktopOnly(Component.TableOfContents())
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Search(),
    Component.Darkmode(),
    Component.DesktopOnly(Component.Explorer()),
  ],
  right: [],
}
