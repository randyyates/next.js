import { workUnitAsyncStorage } from './work-unit-async-storage.external'
import { RenderStage } from './staged-rendering'

/**
 * An async server component that gates segments that are runtime prefetchable
 * behind a promise that ensures the non-runtime-prefetchable segments have rendered
 * first. This is to allow discriminated behavior of runtime data APIs like
 * cookies and headers in the part of the tree that is runtime prefetchable.
 *
 * This only applies to dev request stores where staged rendering is used for
 * validation. Production prerenders use the pipeline task sequence to control
 * stage transitions directly and don't need this gate component.
 */
export async function AsRuntimePrefetchable({
  children,
}: {
  children: React.ReactNode
}) {
  const workUnitStore = workUnitAsyncStorage.getStore()

  if (workUnitStore) {
    switch (workUnitStore.type) {
      case 'request': {
        const requestStore = workUnitStore
        const stagedRendering = requestStore.stagedRendering
        // The render starts in the EarlyStatic stage where non-prefetchable
        // segments render immediately. Prefetchable segments wait here until
        // the Static stage, ensuring non-prefetchable segments get a head
        // start. This separation allows runtime data APIs (cookies, headers)
        // to resolve at different times for each group.
        if (stagedRendering) {
          await stagedRendering.waitForStage(RenderStage.Static)
        }
        break
      }
      default: {
        // noop
      }
    }
  }

  return children
}
