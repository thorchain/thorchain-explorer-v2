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
      >
        <template #table-row="props">
          <span v-if="props.column.field === 'name'">
            {{ props.row.name }}
          </span>

          <span v-else-if="props.column.field === 'checksum'" class="checksum">
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

          <span v-else-if="props.column.field === 'origin'">
            <a class="clickable" :href="props.row.origin" target="_blank">
              {{ props.row.displayOrigin }}
            </a>
          </span>

          <span v-else>
            {{ props.row[props.column.field] }}
          </span>
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
      ],
    }
  },
  mounted() {
    this.fetchCodes()
  },
  methods: {
    async fetchCodes() {
      try {
        const { data } = await this.$api.getCodes()

        if (!data?.codes) {
          console.error('Invalid data structure')
          return
        }

        this.codes = data.codes.map((item) => ({
          name: this.formatName(item.origin),
          code: item.code,
          checksum: item.code,
          deployers: item.deployers || [],
          origin: item.origin,
          displayOrigin: this.formatOrigin(item.origin),
        }))

        this.loading = false
      } catch (error) {
        console.error('Error:', error)
      }
    },
    formatOrigin(origin) {
      if (!origin) return ''
      return origin.split('/').pop()
    },
    formatName(origin) {
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
.checksum {
  display: flex;
  align-items: center;
  gap: $space-8;
}
</style>
