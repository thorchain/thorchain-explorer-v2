<template>
  <stat-table :table-settings="state">
    <template #Balance>
      <span v-if="balance && runePrice">
        {{ balance | number('0,0.00') }}
        (<span class="value">{{ balance * runePrice | currency }}</span>)
      </span>
      <span v-else>-</span>
    </template>
  </stat-table>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  props: ['balance', 'state'],
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice'
    })
  }
}
</script>

<style>

</style>
