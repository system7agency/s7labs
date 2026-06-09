/**
 * Public re-export of the slug-to-component dispatcher. Kept as a separate
 * thin file so the page can import a stable name even if we later swap the
 * implementation for a lazy-loaded variant.
 */
export { renderResultForMiniApp as dispatchInternal } from './dispatch'
