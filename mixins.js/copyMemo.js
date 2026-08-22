// Hidden affordance: clicking a rendered memo copies it to the clipboard.
//
// Shared by the only two places a memo is rendered — TechnicalDetailsCard.vue
// (used by every extracted hero) and SwapHero.vue's own inline technical rows
// — so both behave identically. Deliberately NOT folded into mixins.js/global,
// which is applied via Vue.mixin() to every component in the app: this owns
// per-component `memoCopied` state that only these two screens need.
//
// The memo cell is already truncated with the full value in a tooltip, so the
// tooltip doubles as the copy feedback surface (it swaps to "Copied!" for a
// beat) rather than introducing a separate toast — keeping the feature
// discoverable on hover without adding visible chrome.
export default {
  data() {
    return {
      memoCopied: false,
    }
  },
  beforeDestroy() {
    clearTimeout(this.memoCopyTimer)
  },
  methods: {
    // Tooltip content for a memo cell: the full (visually truncated) memo at
    // rest, swapped for confirmation right after a copy. Returns undefined
    // when there's no memo so v-tooltip renders nothing at all.
    memoTooltip(memo) {
      if (!memo) return undefined
      return this.memoCopied ? 'Copied!' : memo
    },
    copyMemo(memo) {
      if (!memo) return
      navigator.clipboard.writeText(memo).then(
        () => {
          this.memoCopied = true
          clearTimeout(this.memoCopyTimer)
          this.memoCopyTimer = setTimeout(() => {
            this.memoCopied = false
          }, 1500)
        },
        (err) => {
          console.error('Could not copy memo: ', err)
        }
      )
    },
  },
}
