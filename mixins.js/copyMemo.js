// Hidden affordance: clicking a rendered memo copies it to the clipboard.
//
// Shared by the only two places a memo is rendered — TechnicalDetailsCard.vue
// (used by every extracted hero) and SwapHero.vue's own inline technical rows
// — so both behave identically. Deliberately NOT folded into mixins.js/global,
// which is applied via Vue.mixin() to every component in the app: only these
// two screens render a memo.
//
// The copy is deliberately silent. The memo cell is truncated with the full
// value in its tooltip, and on touch the same tap both copies and opens that
// tooltip — so swapping the tooltip to a "Copied!" confirmation would replace
// the only way to read the full memo on mobile with feedback the user didn't
// ask for. Reading the memo wins; the copy is a bonus.
export default {
  methods: {
    // Tooltip content for a memo cell: always the full (visually truncated)
    // memo. Returns undefined when there's no memo so v-tooltip renders
    // nothing at all.
    memoTooltip(memo) {
      return memo || undefined
    },
    copyMemo(memo) {
      if (!memo) return
      navigator.clipboard.writeText(memo).catch((err) => {
        console.error('Could not copy memo: ', err)
      })
    },
  },
}
