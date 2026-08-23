// Makes vue-good-table's `fixed-header` clone behave as a page-level
// sticky header — see the "Sticky table header" comment in
// assets/styles/tables.scss for why the clone exists at all. It ships no
// scroll handling of its own, so everything below is on us:
//
// - scrollLeft mirrored from the body, so the two stay aligned
//   horizontally. The clone is overflow-x: hidden; the body keeps the only
//   real scrollbar.
// - `top` measured off #header (layouts/default.vue), which is 51px below
//   the `lg` breakpoint and 67px at/above it — the CSS fallback can only
//   be right at one width. Re-measured on resize.
// - A negative margin-bottom cancelling the clone's own height: sticky is
//   in-flow, so it would otherwise stack above the body while the hidden
//   real thead underneath still reserves its height, leaving a blank band.
// - Column widths copied off the real thead (see mirrorFixedHeaderWidths).
//
// Binds on `updated` as well as `mounted`: consumers render their table
// behind a v-if, so it isn't in the DOM yet on first mount. Re-binding is
// skipped while the same nodes are still in place.
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
      const realTable = body.querySelector('table.vgt-table')
      if (
        this._stickyHeaderSyncBody === body &&
        this._stickyHeaderSyncTable === realTable
      ) {
        // Listeners still stand; widths may not.
        this._stickyHeaderSyncLayout?.()
        return
      }

      this.teardownStickyHeaderScrollSync()
      const onScroll = () => {
        fixed.scrollLeft = body.scrollLeft
      }
      body.addEventListener('scroll', onScroll, { passive: true })

      // Conditional writes only, so a no-op sync stays a no-op and the
      // MutationObserver below can watch the attributes written here.
      const setStyle = (el, prop, value) => {
        if (el.style[prop] !== value) el.style[prop] = value
      }

      // !important because tables.scss pins `th.no-padding` to 32px that
      // way on both tables: advisory under the real table's auto layout,
      // obeyed exactly under the clone's fixed one. Priority is compared
      // too, so a re-patch without it doesn't read as unchanged.
      const setPinnedWidth = (el, value) => {
        for (const prop of ['width', 'min-width', 'max-width']) {
          if (
            el.style.getPropertyValue(prop) === value &&
            el.style.getPropertyPriority(prop) === 'important'
          )
            continue
          el.style.setProperty(prop, value, 'important')
        }
      }

      const applyHeaderOffset = () => {
        const siteHeader = document.getElementById('header')
        setStyle(
          fixed,
          'top',
          siteHeader ? `${siteHeader.getBoundingClientRect().height}px` : ''
        )
      }
      applyHeaderOffset()
      window.addEventListener('resize', applyHeaderOffset, { passive: true })

      // Measured, not offsetHeight: the height is fractional (th padding
      // is in `em`) and rounding leaves a seam of body showing through.
      const collapseFixedHeaderFlow = () => {
        setStyle(
          fixed,
          'marginBottom',
          `-${fixed.getBoundingClientRect().height}px`
        )
      }

      // Copied cell for cell off the hidden real header rather than left
      // to vue-good-table, which never sizes the leading
      // line-numbers/checkbox th — and under a fixed layout an unsized
      // first-row cell eats the leftover width, shifting every column
      // after it. Indexes correspond: same `columns`, same
      // `v-if="!column.hidden"` in both headers.
      const mirrorFixedHeaderWidths = () => {
        const cloneTable = fixed.querySelector('table.vgt-table')
        if (!realTable || !cloneTable) return
        setPinnedWidth(
          cloneTable,
          `${realTable.getBoundingClientRect().width}px`
        )

        const realCells = realTable.tHead?.rows[0]?.cells
        const cloneCells = cloneTable.tHead?.rows[0]?.cells
        if (!realCells || !cloneCells) return
        for (let i = 0; i < cloneCells.length; i++) {
          const realCell = realCells[i]
          if (!realCell) continue
          // Rect width is border-box, and so is `width` here
          // (base.scss sets box-sizing: border-box on *).
          setPinnedWidth(
            cloneCells[i],
            `${realCell.getBoundingClientRect().width}px`
          )
        }
      }

      const syncFixedHeaderLayout = () => {
        // Widths first: they decide how labels wrap, which sets the height.
        mirrorFixedHeaderWidths()
        collapseFixedHeaderFlow()
      }
      syncFixedHeaderLayout()
      // The real table too: it's the input above, and resizes on its own
      // (rows arriving, longer values).
      const resizeObserver =
        typeof ResizeObserver === 'undefined'
          ? null
          : new ResizeObserver(syncFixedHeaderLayout)
      resizeObserver?.observe(fixed)
      if (realTable) resizeObserver?.observe(realTable)

      // Catches VgtTableHeader re-patching `columnStyles` over the widths
      // written above: it re-renders off its own ResizeObserver, and
      // redistributing width leaves every observed box the same size. On
      // the container, so it survives Vue replacing the table node.
      const mutationObserver =
        typeof MutationObserver === 'undefined'
          ? null
          : new MutationObserver(syncFixedHeaderLayout)
      mutationObserver?.observe(fixed, {
        attributes: true,
        attributeFilter: ['style'],
        subtree: true,
      })

      this._stickyHeaderSyncBody = body
      this._stickyHeaderSyncTable = realTable
      this._stickyHeaderSyncLayout = syncFixedHeaderLayout
      this._stickyHeaderSyncCleanup = () => {
        body.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', applyHeaderOffset)
        resizeObserver?.disconnect()
        mutationObserver?.disconnect()
      }
    },
    teardownStickyHeaderScrollSync() {
      this._stickyHeaderSyncCleanup?.()
      this._stickyHeaderSyncCleanup = null
      this._stickyHeaderSyncBody = null
      this._stickyHeaderSyncTable = null
      this._stickyHeaderSyncLayout = null
    },
  },
}
