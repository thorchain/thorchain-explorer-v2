<template>
  <page>
    <card title="Contracts">
      <TableLoader v-if="loading" :cols="columns" :rows="Array(7).fill({})" />
      <vue-good-table
        v-else
        :columns="columns"
        :rows="codes"
        style-class="vgt-table net-table"
        :sort-options="{
          enabled: true,
        }"
        :group-options="{
          enabled: true,
          collapsable: true,
          rowKey: 'product',
        }"
      >
        <template slot="table-row" slot-scope="props">
          <span v-if="props.column.field === 'name' && props.row.children">
            {{ props.row.name }}
          </span>

          <template v-else-if="!props.row.children">
            <span v-if="props.column.field === 'name'">
              {{ props.row.name }}
            </span>

            <span
              v-else-if="props.column.field === 'checksum' && props.row.code"
              class="checksum"
            >
              {{ props.row.code.slice(0, 6) }}...{{ props.row.code.slice(-4) }}
              <copy :str-copy="props.row.code" />
            </span>

            <div
              v-else-if="props.column.field === 'deployers'"
              class="contracts"
            >
              <span
                v-for="deployer in props.row.deployers"
                :key="deployer"
                class="asset-cell"
              >
                <nuxt-link :to="`/address/${deployer}`" class="clickable">
                  {{ deployer.slice(-4) }}
                </nuxt-link>
              </span>
            </div>

            <div
              v-else-if="props.column.field === 'contracts'"
              class="contracts"
            >
              <span
                v-for="contract in props.row.contracts"
                :key="contract"
                class="asset-cell"
              >
                <nuxt-link :to="`/address/${contract}`" class="clickable">
                  {{ contract.slice(-4) }}
                </nuxt-link>
              </span>
            </div>

            <span
              v-else-if="props.column.field === 'origin' && props.row.origin"
            >
              <a class="clickable" :href="props.row.origin" target="_blank">
                {{ props.row.displayOrigin }}
              </a>
            </span>

            <span v-else-if="props.column.field === 'audit'">
              <span v-if="!props.row.auditLink">
                {{ props.row.audit }}
              </span>
              <a
                v-else
                class="clickable"
                :href="props.row.auditLink"
                target="_blank"
              >
                {{ props.row.audit }}
              </a>
            </span>

            <span v-else>
              {{ props.row[props.column.field] || '' }}
            </span>
          </template>

          <span v-else></span>
        </template>
      </vue-good-table>
    </card>
  </page>
</template>

<script>
export default {
  data() {
    return {
      loading: true,
      codes: [],
      columns: [
        {
          label: 'Product',
          field: 'product',
          width: '160px',
        },
        {
          label: 'Name',
          field: 'name',
          width: '160px',
        },
        {
          label: 'Checksum',
          field: 'checksum',
          sortable: true,
          tdClass: 'mono',
          width: '160px',
        },
        {
          label: 'Deployers',
          field: 'deployers',
          sortable: true,
          width: '160px',
        },
        {
          label: 'Origin',
          field: 'origin',
          sortable: true,
          width: '160px',
        },
        {
          label: 'Version',
          field: 'version',
          sortable: false,
          width: '150px',
        },
        {
          label: 'Audit',
          field: 'audit',
          sortable: false,
          width: '250px',
        },
        {
          label: 'Contracts',
          field: 'contracts',
          sortable: false,
        },
      ],
    }
  },
  mounted() {
    try {
      this.fetchMiddleCodes()
    } catch (error) {
      console.error(error)
      this.fetchCodes()
    }
  },
  methods: {
    async fetchMiddleCodes() {
      const { data } = await this.$api.getContracts()

      this.formatContracts(data)
    },
    async fetchCodes() {
      const { data } = await this.$api.getCodes()

      if (!data?.codes) {
        console.error('Invalid data structure')
        return
      }

      this.formatContracts(data.codes)
    },
    formatContracts(codes) {
      const grouped = {}

      codes.forEach((item) => {
        const product = item.product || 'Unknown'
        // const name = this.formatName(item.origin)
        const displayName = this.formatDisplayName(item.origin)

        if (!grouped[product]) {
          grouped[product] = {
            product,
            name: displayName,
            children: [],
            totalDeployers: 0,
            sampleOrigin: item.origin,
          }
        }

        grouped[product].children.push({
          product,
          name: displayName,
          code: item.code,
          checksum: item.code,
          deployers: item.deployers || [],
          origin: item.origin,
          displayOrigin: this.formatOrigin(item.origin),
          version: item.version,
          audit: item.audit,
          auditLink: item.url,
          contracts: item.contracts,
        })

        grouped[product].totalDeployers += item.deployers?.length || 0
      })

      this.codes = Object.values(grouped)
      this.loading = false
    },
    formatOrigin(origin) {
      if (!origin) return ''
      return origin.split('/').pop()
    },
    formatName(origin) {
      if (!origin) return ''
      const parts = origin.split('/')
      return parts[parts.length - 1]
    },
    formatDisplayName(origin) {
      if (!origin) return ''
      const parts = origin.split('/')
      const lastPart = parts[parts.length - 1]
      return lastPart
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    },
    formatDeployers(deployers) {
      if (!deployers || deployers.length === 0) return ''
      return deployers
        .map((d) => {
          if (d.length <= 4) return d
          return `${d.slice(-4)}`
        })
        .join(', ')
    },
  },
}
</script>

<style lang="scss" scoped>
.contracts {
  display: flex;
  gap: $space-4;
  align-items: center;
}

.asset-cell {
  margin: $space-2;
  padding: $space-4 $space-8;
  border-radius: $radius-sm;
  border: 1px solid var(--border-color);
  background-color: var(--bgl-color);
}

::v-deep .vgt-table.net-table {
  background-color: var(--bg-color);
  table-layout: fixed;
  width: 100%;
  min-width: 1400px;

  th,
  td {
    white-space: nowrap;
  }
  .vgt-row-header {
    background-color: var(--bg-color);
    cursor: pointer;
    font-weight: bold;
    border-top: 1px solid var(--border-color) !important;
    border-bottom: 1px solid var(--border-color) !important;
    &:hover {
      color: var(--primary-color);
    }
  }

  tr.vgt-row:not(.vgt-row-header) {
    background-color: var(--bg-color);
  }

  .checksum {
    display: flex;
    align-items: center;
    gap: $space-8;
  }
}
</style>
