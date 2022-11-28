<template>
  <Card>
    <vue-good-table
      :columns="saverCols"
      :rows="saverDetails"
      style-class="vgt-table net-table"
      :pagination-options="{
        enabled: true,
        perPage: 50,
        perPageDropdownEnabled: true,
      }"
    >
      <template slot="table-row" slot-scope="props">
        <template v-if="props.column.field.includes('asset_address')">
          <NuxtLink
            class="address-link clickable"
            :to="`/address/${props.row.asset_address}`"
          >
            {{ props.formattedRow[props.column.field] }}
          </NuxtLink>
        </template>
        <template v-else-if="props.column.field.includes('asset')">
          <span>
            {{ props.formattedRow[props.column.field] }}
          </span>
          <small>
            {{ props.row.asset }}
          </small>
        </template>
        <span v-else>
          {{ props.formattedRow[props.column.field] }}
        </span>
      </template>
    </vue-good-table>
  </Card>
</template>

<script>
export default {
  data() {
    return {
      loading: false,
      error: false,
      saverCols: [
        {
          label: "Address",
          field: "asset_address",
          tdClass: "mono clickable",
          formatFn: this.formatAddress,
        },
        {
          label: "Asset Balance",
          field: "asset_deposit_value",
          tdClass: "mono",
          type: "number",
          formatFn: this.baseAmountFormatOrZero,
        },
        {
          label: "Earned",
          field: "asset_earned",
          tdClass: "mono",
          type: "number",
          formatFn: this.baseAmountFormatOrZero,
        },
        {
          label: "Annualised Yield",
          field: "APR",
          tdClass: "mono",
          type: "percentage",
        },
        {
          label: "Last Height Added",
          field: "last_add_height",
          tdClass: "mono",
          type: "number",
          formatFn: this.normalFormat,
        },
      ],
      saverDetails: [],
      lastBlockHeight: undefined,
    };
  },
  async asyncData({ params }) {
    return { poolName: params.poolName };
  },
  methods: {
    updateSavers() {
      this.loading = true;
      this.$api
        .getLastBlockHeight()
        .then(({ data }) => {
          this.lastBlockHeight = data.find((e) => e.chain === "BTC").thorchain;
        })
        .catch((error) => {
          this.error = true;
          console.error(error);
        });

      this.$api
        .getSavers(this.poolName)
        .then(({ data: savers }) => {
          this.saverDetails = savers.map((saverDetail) => ({
            ...saverDetail,
            asset_earned: saverDetail.asset_deposit_value - saverDetail.units,
            APR: this.calcAPR(saverDetail),
          }));
        })
        .catch((e) => {
          this.error = true;
          console.error(e);
        });
    },
    calcAPR(saverDetail) {
      if (!this.lastBlockHeight) return 0;
      const diffHeight = (this.lastBlockHeight - saverDetail.last_add_height);
      const periodPerYear = 5256000 / diffHeight
      return ((saverDetail.asset_deposit_value / saverDetail.units) - 1) * periodPerYear
    },
  },
  mounted() {
    this.updateSavers();
  },
};
</script>

<style lang='scss'>
.address-link {
  text-decoration: none;
}
</style>