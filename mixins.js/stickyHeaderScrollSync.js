// vue-good-table's `fixed-header` prop renders a second, fully-functional
// cloned <thead> in its own `.vgt-fixed-header` element (same sort/filter
// click handlers as the real one — see assets/styles/tables.scss's
// "Sticky table header" comment for why this exists at all: position:sticky
// can't combine page-level stickiness with the body's own horizontal
// scroll on the SAME element). vue-good-table ships zero scroll listeners
// of its own, so without this the fixed header just sits at whatever
// horizontal scroll position it loaded at while the real body scrolls
// past underneath it.
//
// Mirrors scrollLeft (not a CSS transform) — .vgt-fixed-header is
// overflow-x: hidden, and setting .scrollLeft programmatically still works
// on a hidden-overflow element; it just can't be scrolled directly by the
// user, which is the point (there's only ever one real, visible horizontal
// scrollbar: the body's).
//
// Also measures #header's real rendered height and applies it as this
// element's own `top`, overriding the CSS fallback (tables.scss) — #header
// (layouts/default.vue) changes height at the `lg` breakpoint (51px below
// it, 67px at/above — its padding grows), so any single hardcoded top
// value is only ever correct at one viewport width; everywhere else it
// either leaves a gap the scrolling body shows through (measured value too
// small) or the header sticks lower than the site nav actually needs. Kept
// in sync with a resize listener since crossing that breakpoint changes it
// live, not just on initial load.
//
// And collapses the fixed header's own contribution to the flow with a
// negative bottom margin equal to its rendered height — upstream ships
// .vgt-fixed-header as position: absolute (out of flow, overlaying the
// real thead), and tables.scss has to switch it to position: sticky to
// pin it to the PAGE rather than to .vgt-wrap. Sticky is in-flow, so the
// clone then stacks ABOVE the body instead of over it, while the real
// thead underneath still reserves its full height (it's `visibility:
// hidden`, not `display: none` — vue-good-table mirrors column widths by
// reading computed widths off those real <th>s, so it has to keep laying
// out). Two header heights of space, one visible header: a blank band
// between the sticky header and the first row that tracks the header's
// height. The margin pulls the body back up under the clone so the two
// overlap again, as they do upstream. CSS can't express it (the height
// isn't knowable in a stylesheet), and it's not a constant — labels wrap
// at narrow widths, fonts settle after load — so a ResizeObserver
// re-applies it whenever the clone's own height changes.
//
// Re-binds on every re-render (`updated`), not just `mounted` — every
// consumer (components/Transactions.vue, pages/nodes/component/nodeTable.vue)
// renders its <vue-good-table> behind a v-if (a loading guard / `rows`
// truthiness check), so the table doesn't exist in the DOM yet when this
// component first mounts. Idempotent: skips rebinding when already
// attached to the same body element (e.g. a page-change update that
// re-renders rows but keeps the same wrapper node).
export default {
  beforeDestroy() {
    this.teardownStickyHeaderScrollSync()
  },
  updated() {
    this.$nextTick(this.setupStickyHeaderScrollSync)
  },
  mounted() {
    this.$nextTick(this.setupStickyHeaderScrollSync)
  },
  methods: {
    setupStickyHeaderScrollSync() {
      const body = this.$el.querySelector?.('.vgt-responsive')
      const fixed = this.$el.querySelector?.('.vgt-fixed-header')
      if (!body || !fixed) return
      if (this._stickyHeaderSyncBody === body) return

      this.teardownStickyHeaderScrollSync()
      const onScroll = () => {
        fixed.scrollLeft = body.scrollLeft
      }
      body.addEventListener('scroll', onScroll, { passive: true })

      const applyHeaderOffset = () => {
        const siteHeader = document.getElementById('header')
        fixed.style.top = siteHeader
          ? `${siteHeader.getBoundingClientRect().height}px`
          : ''
      }
      applyHeaderOffset()
      window.addEventListener('resize', applyHeaderOffset, { passive: true })

      // Measured, not offsetHeight: the clone's height is routinely
      // fractional (th padding is in `em`), and rounding it leaves a
      // sub-pixel seam of scrolling body visible under the header.
      const collapseFixedHeaderFlow = () => {
        fixed.style.marginBottom = `-${fixed.getBoundingClientRect().height}px`
      }
      collapseFixedHeaderFlow()
      // Safe against feedback: margin-bottom changes the wrapper's height,
      // never the observed element's own box.
      const resizeObserver =
        typeof ResizeObserver === 'undefined'
          ? null
          : new ResizeObserver(collapseFixedHeaderFlow)
      resizeObserver?.observe(fixed)

      this._stickyHeaderSyncBody = body
      this._stickyHeaderSyncCleanup = () => {
        body.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', applyHeaderOffset)
        resizeObserver?.disconnect()
      }
    },
    teardownStickyHeaderScrollSync() {
      this._stickyHeaderSyncCleanup?.()
      this._stickyHeaderSyncCleanup = null
      this._stickyHeaderSyncBody = null
    },
  },
}
