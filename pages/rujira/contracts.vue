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
          initialSortBy: { field: 'name', type: 'asc' },
        }"
        :group-options="{
          enabled: true,
          collapsable: true,
          rowKey: 'name',
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

            <span v-else-if="props.column.field === 'deployers'">
              <span
                v-for="(deployer, index) in props.row.deployers"
                :key="deployer"
              >
                <nuxt-link :to="`/address/${deployer}`" class="clickable">
                  {{ deployer.slice(-4) }}
                </nuxt-link>
                <span v-if="index < props.row.deployers.length - 1">, </span>
              </span>
            </span>

            <span v-else-if="props.column.field === 'contracts'">
              <span
                v-for="(contract, index) in props.row.contracts"
                :key="contract"
              >
                <nuxt-link
                  :to="`/address/${contract}`"
                  class="clickable mini-bubble"
                >
                  {{ formatAddress(contract) }}
                </nuxt-link>
                <span v-if="index < props.row.deployers.length - 1">, </span>
              </span>
            </span>

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
import { props } from 'qrcode.vue'

export default {
  data() {
    return {
      loading: true,
      codes: [],
      columns: [
        {
          label: 'Name',
          field: 'name',
        },
        {
          label: 'Checksum',
          field: 'checksum',
          sortable: true,
          tdClass: 'mono',
        },
        {
          label: 'Deployers',
          field: 'deployers',
          sortable: true,
          tdClass: 'mono',
        },
        {
          label: 'Origin',
          field: 'origin',
          sortable: true,
        },
        {
          label: 'Version',
          field: 'version',
          sortable: false,
        },
        {
          label: 'Audit',
          field: 'audit',
          sortable: false,
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
        const name = this.formatName(item.origin)
        const displayName = this.formatDisplayName(item.origin)

        if (!grouped[name]) {
          grouped[name] = {
            name: displayName,
            children: [],
            totalDeployers: 0,
            sampleOrigin: item.origin,
          }
        }

        grouped[name].children.push({
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

        grouped[name].totalDeployers += item.deployers?.length || 0
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
::v-deep .vgt-table.net-table {
  background-color: var(--bg-color);
  .vgt-row-header {
    background-color: var(--bg-color);
    cursor: pointer;
    font-weight: bold;
    border-top: 1px solid var(--border-color) !important;
    border-bottom: 1px solid var(--border-color) !important;
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
