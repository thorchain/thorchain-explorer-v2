<template>
  <Card title="Latest Transactions">
    <template #more>
      <nuxt-link
        to="/txs"
        class="more-link clickable"
        style="margin-left: auto"
      >
        More
        <ArrowRightIcon />
      </nuxt-link>
    </template>
    <div>
      <template v-if="transactions">
        <ActionRow v-for="(t, i) in transactions" :key="i" :row="t" />
      </template>
      <div v-else class="loading">
        <BounceLoader color="var(--font-color)" size="3rem" />
      </div>
    </div>
  </Card>
</template>

<script>
import BounceLoader from 'vue-spinner/src/BounceLoader.vue'
import ArrowRightIcon from '~/assets/images/arrow-right.svg?inline'
import ActionRow from '~/components/transactions/ActionRow.vue'

export default {
  name: 'LatestTransactions',
  components: {
    BounceLoader,
    ArrowRightIcon,
    ActionRow,
  },
  props: {
    transactions: {
      type: Array,
      default: null,
    },
  },
}
</script>

<style lang="scss">
.more-link {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: $font-size-sm;

  svg {
    fill: currentColor;
    height: 1rem;
    width: 1rem;
  }
}

.loading {
  display: flex;
  justify-content: center;
  padding: $space-20 0;
}
</style>
