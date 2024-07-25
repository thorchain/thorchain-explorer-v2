<template>
  <Page>
    <Card title="Vaults">
      <template v-if="asgard.length > 0">
        <vue-good-table
          v-if="cols"
          :columns="cols"
          :rows="[...asgard]"
          style-class="vgt-table net-table"
        >
          <template slot="table-row" slot-scope="props">
            <span
              v-if="props.column.field == 'hash'"
              @click="gotoAddr(props.row.hash)"
            >
              <span v-tooltip="props.row.hash" class="mono clickable">
                {{ props.row.hash.slice(0, 8) }}...{{
                  props.row.hash.slice(-8)
                }}
              </span>
            </span>
            <span v-else-if="props.column.field == 'bond'">
              <span
                v-if="props.row.bond"
                v-tooltip="curFormat(runePrice * props.row.bond)"
                class="mono"
              >
                <span class="extra">{{ runeCur() }}</span>
                {{ numberFormat(props.row.bond) }}
              </span>
              <span v-else> - </span>
            </span>
            <span v-else-if="props.column.field == 'total_value'">
              <span
                v-if="props.row.total_value"
                v-tooltip="curFormat(runePrice * props.row.total_value)"
                class="mono"
              >
                <span class="extra">{{ runeCur() }}</span>
                {{ numberFormat(props.row.total_value) }}
              </span>
              <span v-else> - </span>
            </span>
            <span v-else-if="props.column.field == 'membership_count'">
              <div>
                <v-tooltip>
                  <span v-if="props.row.membership_count" class="mono">
                    {{ props.row.membership_count }}
                  </span>
                  <template slot="popper">
                    <div class="popper-card">
                      <div class="card-header">Nodes Member</div>
                      <div class="card-body grid-template">
                        <small
                          class="mono"
                          v-for="node in props.row.membership"
                        >
                          .{{ node.node_address.slice(-4) }}
                        </small>
                      </div>
                    </div>
                  </template>
                </v-tooltip>
                <span v-if="!props.row.membership_count"> - </span>
              </div>
            </span>
            <span v-else-if="props.column.field == 'type'">
              <div
                :class="[
                  'mini-bubble big',
                  { info: props.row.type == 'Yggdrasil' },
                ]"
              >
                <span>{{ props.row.type }}</span>
              </div>
            </span>
            <span v-else-if="props.column.field == 'status'">
              <div
                :class="[
                  'mini-bubble big',
                  { yellow: props.row.status == 'Standby' },
                ]"
              >
                <span>{{ props.row.status }}</span>
              </div>
            </span>
          </template>
        </vue-good-table>
      </template>
      <div v-else class="loading">
        <BounceLoader color="var(--font-color)" size="3rem" />
      </div>
    </Card>
  </Page>
</template>

<script>
import { mapGetters } from "vuex";
import BounceLoader from "vue-spinner/src/BounceLoader.vue";
import { runeCur } from "~/utils";

export default {
  components: {
    BounceLoader,
  },
  data() {
    return {
      cols: [
        {
          label: "Hash",
          field: "hash",
        },
        {
          label: "Type",
          field: "type",
        },
        {
          label: "Status",
          field: "status",
        },
        {
          label: "Bond",
          field: "bond",
          type: "number",
        },
        {
          label: "Total Value",
          field: "total_value",
          type: "number",
        },
        {
          label: "Value/Bond",
          field: "vb",
          type: "percentage",
        },
        {
          label: "Node Members",
          field: "membership_count",
          type: "number",
        },
        {
          label: "Ins",
          field: "ins",
          type: "number",
          formatFn: this.numberFormat,
          tdClass: "mono",
        },
        {
          label: "Outs",
          field: "outs",
          type: "number",
          formatFn: this.numberFormat,
          tdClass: "mono",
        },
      ],
      yggdrasil: [],
      asgard: [],
    };
  },
  mounted() {
    // filter out yggdrasil
    // this.$api.getYggdrasil().then(async (res) => {
    //   this.yggdrasil = await this.formatVaults(res?.data, 'Yggdrasil')
    // }).catch((e) => {
    //   console.error(e)
    // })

    this.$api
      .getAsgard()
      .then(async (res) => {
        const poolsPrice = await this.formatPoolPrice();
        const nodes = await this.formatNodes();
        this.asgard = await this.formatVaults(
          res?.data,
          "Asgard",
          poolsPrice,
          nodes
        );
      })
      .catch((e) => {
        console.error(e);
      });
  },
  methods: {
    formatStatus(status) {
      if (status === "ActiveVault") {
        return "Active";
      }
      return status;
    },
    async formatPoolPrice() {
      const pools = await this.$api.getPools();
      const poolsPrice = [];
      pools.data.map((p) => (poolsPrice[p.asset] = p.assetPrice));
      return poolsPrice;
    },
    async formatNodes() {
      const nodes = await this.$api.getNodes();
      const nodesFormat = [];
      nodes.data.map((n) => (nodesFormat[n.pub_key_set?.secp256k1] = n));
      return nodesFormat;
    },
    formatVaults(
      data,
      type = "Yggdrasil",
      poolsPrice = undefined,
      nodes = undefined
    ) {
      const y = [];
      for (const vault of data) {
        let bond = vault?.bond / 1e8;
        let totalValue =
          +vault?.total_value < 100 ? 0.1 : vault?.total_value / 1e8;
        let vb;
        if (type === "Asgard" && poolsPrice) {
          totalValue = 0;
          vault.coins?.forEach((a) => {
            totalValue += (+(poolsPrice[a.asset] || 0) * +a.amount) / 1e8;
          });
          bond = 0;
          vault.membership?.forEach((m) => {
            bond += nodes[m].total_bond / 1e8;
          });
          vb = totalValue / bond;
        }
        y.push({
          hash: vault?.addresses.find((e) => e.chain === "THOR").address,
          type,
          status: this.formatStatus(vault?.status),
          ins: vault?.inbound_tx_count,
          bond,
          total_value: totalValue,
          membership_count: vault?.membership?.length,
          membership: vault?.membership?.map((v) => nodes[v]),
          vb,
          outs: vault?.outbound_tx_count,
        });
      }
      return y;
    },
    runeCur() {
      return runeCur();
    },
    curFormat(number) {
      return this.$options.filters.currency(number);
    },
    numberFormat(number) {
      return this.$options.filters.number(number, "0,0");
    },
  },
  computed: {
    ...mapGetters({
      runePrice: "getRunePrice",
    }),
  },
};
</script>

<style>
.grid-template {
  display: grid;
  row-gap: 0.3rem;
  column-gap: 0.8rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
</style>
