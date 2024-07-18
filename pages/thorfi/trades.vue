<template>
    <Page>
        <Card :isLoading="!(rows && rows.length > 0)">
            <vue-good-table v-if="cols && rows.length > 0" 
                :columns="cols" 
                :rows="rows" 
                style-class="vgt-table net-table"
                :pagination-options="{
                    enabled: true,
                    perPage: 30,
                    perPageDropdownEnabled: false,
                }" 
                :sort-options="{
                    enabled: true
                }"
            >
                <template slot="table-column" slot-scope="props">
                    <span>
                        {{ props.column.label }}
                    </span>
                </template>
                <template slot="table-row" slot-scope="props">
                    <div v-if="props.column.field == 'asset'" v-tooltip="props.row.asset" class="cell-content">
                        <AssetIcon :asset="props.row.asset" chain="THOR.RUNE" />
                        <span>{{ props.formattedRow[props.column.field] }}</span>
                    </div>
                    <div v-else-if="props.column.field == 'depth' || props.column.field == 'vaultDepth'">
                        <span>{{ props.formattedRow[props.column.field] }}
                            <small>{{ showAsset(props.row.asset) }}</small>
                        </span> 
                    </div>
                    <span v-else>
                        <span v-if="props.row[props.column.field]">
                            {{ props.formattedRow[props.column.field] }}
                        </span>
                        <span v-else>-</span>
                    </span>
                </template>
            </vue-good-table>
        </Card>
    </Page>
</template>

<script>
import { formatAsset, tradeToAsset } from '~/utils'
import InfoIcon from '~/assets/images/info.svg?inline'
import { sumBy } from 'lodash'

export default {
    components: { InfoIcon },
    data() {
        return {
            cols: [
                {
                    label: 'Asset',
                    field: 'asset',
                    formatFn: formatAsset
                },
                {
                    label: 'Trade Depth',
                    field: 'depth',
                    type: 'number',
                    thClass: 'end',
                    formatFn: this.baseAmountFormat,
                    tdClass: 'mono end',
                },
                {
                    label: 'Trade / Pool Depth',
                    field: 'depthRatio',
                    type: 'percentage',
                    tdClass: 'mono',
                },
                {
                    label: 'Vault Depth',
                    field: 'vaultDepth',
                    type: 'number',
                    formatFn: this.baseAmountFormat,
                    tdClass: 'mono',
                },
                {
                    label: 'Vault / Pool Depth',
                    field: 'vaultRatio',
                    type: 'percentage',
                    tdClass: 'mono',
                },
                {
                    label: 'Units',
                    field: 'units',
                    type: 'number',
                    tdClass: 'mono',
                    thClass: 'end',
                    formatFn: this.numberFormat
                }
            ],
            rows: [],
            error: false
        }
    },
    async mounted() {
        try {
            this.rows = await this.updateTradeData()
        } catch(e) {
            this.error = true
            console.error(e)
        }
    },
    methods: {
        async updateTradeData() {
            const { data: tradeAssets } = await this.$api.getTradeAssets()
            const { data: pools } = await this.$api.getThorPools()
            const { data: asgard } = await this.$api.getAsgard()

            const assetPerVault = {}
            const asgardCoins = asgard.map(a => a.coins)
            for (let i = 0; i < asgardCoins.length; i++) {
                const v = asgardCoins[i]
                for (let j = 0; j < v.length; j++) {
                    const {asset, amount} = v[j]
                    console.log(asset, amount)
                    if (!assetPerVault[asset]) {
                        assetPerVault[asset] = +amount
                    } else {
                        assetPerVault[asset] += +amount
                    }
                }
            }

            const ret = []
            for (const asset of tradeAssets) {
                const assetName = tradeToAsset(asset.asset)
                const pool = pools.find(p => p.asset === assetName)
                const vaultDepth = assetPerVault[assetName]

                ret.push({
                    ...asset,
                    vaultDepth: vaultDepth ?? 0,
                    vaultRatio: (vaultDepth / pool?.balance_asset) ?? 0,
                    depthRatio: (asset.depth / pool?.balance_asset) ?? 0,
                })
            }

            console.log(ret)

            return ret
        }
    }
}
</script>

<style lang="scss">
.header-icon {
    margin-left: 5px;
    height: 1rem;
    width: 1rem;
    fill: #606266;
    z-index: 2;
}

th.end .table-asset {
    justify-content: flex-end;
}
</style>