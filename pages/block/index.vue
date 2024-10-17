<template>
  <page class="block-container">
    <div class="block-header">
      <BlockIcon class="block-icon"/>
      {{ blockNumber }}
    </div>
    <div class="block-name">
      <span style="color: var(--primary-color)">{{ blockHash }}</span>
      <UtilityBox :value="blockHash" />
    </div>
    <Card v-if="blockRemainingTime" class="block-remaining-time">
      Estimated time to reach block: {{ blockRemainingTime }}
    </Card>
    <info-card :options="blockInfo" />
    <Transactions :txs="txs" :loading="loading" />
  </page>
</template>

<script>
import moment from 'moment';
import { mapGetters } from 'vuex';
import Transactions from '~/components/Transactions.vue';
import BlockIcon from '~/assets/images/block.svg?inline'

export default {
  components: { Transactions,BlockIcon },
  data() {
    return {
      height:null,
      loading: false,
      blockNumber: null,
      blockHash: '',
      blockTime: '',
      blockAge: '',
      height: undefined,
      txs: undefined,
      blockRemainingTime: null,
    };
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
      chainsHeight: 'getChainsHeight',
    }),
    blockInfo() {
      return [
        {
          title: 'Nodes',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'Block Time',
              value: this.blockTime,
            },
            {
              name: 'Block Age',
              value: this.blockAge,
            },
          ],
        },
      ];
    },
  },
  async mounted() {
    this.height = this.$route.query.height;
    await this.fetchBlockInfo(this.height);
    await this.getActions();
    this.calculateRemainingTime();
  },
  methods: {
    async getActions(height) {
      try {
        const res = await this.$api.getActions(height);
        this.height = res.data;
        this.txs = res.data;
        console.log("API Response:", res.data);
      } catch (error) {
        console.error("API Error:", error);
      } 
    },

    async fetchBlockInfo(height) {
      console.log('height',height)
      try {
        const response = await this.$api.getBlockHeight(height);
        console.log("API Response:", response.data);
        const blockData = response.data;
        this.blockNumber = blockData.header.height;
        this.blockHash = blockData.id.hash;
        this.blockTime = moment(blockData.header.time).format('MMM DD YYYY hh:mm:ss A');
        const blockTimestamp = moment(blockData.header.time);
        this.blockAge = moment.duration(moment().diff(blockTimestamp)).humanize();
      } catch (error) {
        console.error("Error fetching block info:", error);
      }
    },

    calculateRemainingTime() {
      const currentHeight = this.chainsHeight?.THOR;
      const targetHeight = this.blockNumber;
      
        if (targetHeight > currentHeight) {
          const blockDifference = targetHeight - currentHeight;
          const blockTimeSeconds = 5.5;
          const remainingSeconds = blockDifference * blockTimeSeconds;
          const duration = moment.duration(remainingSeconds, 'seconds');
          this.blockRemainingTime = duration.humanize();
        } 
       else {
        this.blockRemainingTime = null;
        console.log('Invalid block heights.');
      }
    }
  },
};
</script>

<style lang="scss" scoped>
.block-icon{
  width: 1.2rem;
  height: 1.2rem;
}
.block-header {
  display: flex;
  font-size: 20px !important;
  color: var(--font-color) !important;
  font-weight: bold;
  align-items: center;
  gap: 0.5rem;
  padding-left:1rem;

}
.block-name {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  font-weight: bold;
  font-size:11px;
  color: var(--font-color);
  padding: 0 0.8rem;
  span {
    text-overflow: ellipsis;
    max-width: 70%;
    overflow: hidden;
  }
}
.block-remaining-time {
  margin: 1rem 0;
  font-size: 14px;
  color: var(--primary-color);
}
</style>
