<template>
  <page>
    <swap />
    <div class="header-top-swap">
      <Header title="Top Swaps" />
      <Nav
        :active-mode.sync="tablePeriod"
        :nav-items="tablePeriods"
        pre-text="Period :"
      >
        <template #extra>
          <div
            class="csv-download"
            title="Download CSV"
            @click="downloadSwaps(swaps)"
          >
            <file-download class="clickable"></file-download>
          </div>
        </template>
      </Nav>
      <transactions :txs="swaps" :loading="!swaps" :props="formatProp">
        <template #volume="{ props }">
          <span class="mono">
            {{ smallBaseAmountFormatWithCur(getVolume(props.row)) }}
          </span>
        </template>
      </transactions>
    </div>
  </page>
</template>

<script>
import moment from 'moment'
import swap from '../charts/swap.vue'
import FileDownload from '~/assets/images/file-download.svg?inline'

export default {
  components: {
    swap,
    FileDownload,
  },
  data() {
    return {
      swaps: undefined,
      formatProp: [
        {
          label: 'Volume',
          field: 'volume',
          sortFn: this.volumeSort,
        },
      ],
      tablePeriod: 'day',
      tablePeriods: [
        { text: '1 Day', mode: 'day' },
        { text: '1 Week', mode: 'week' },
        { text: '1 Month', mode: 'month' },
      ],
    }
  },
  watch: {
    tablePeriod(newPeriod) {
      this.$router.push({
        query: {
          ...this.$route.query,
          tablePeriod: newPeriod,
        },
      })
      this.fetchTableData(newPeriod)
    },
  },
  mounted() {
    const queryTablePeriod = this.$route.query.tablePeriod

    let shouldUpdateQuery = false

    if (queryTablePeriod) {
      this.tablePeriod = queryTablePeriod
    } else {
      shouldUpdateQuery = true
    }

    if (shouldUpdateQuery) {
      this.$router.push({
        query: {
          ...this.$route.query,
          tablePeriod: this.tablePeriod,
        },
      })
    }

    this.fetchTableData(this.tablePeriod)
  },
  methods: {
    async fetchTableData(period) {
      try {
        this.swaps = (await this.getTopSwaps(period)).data
      } catch (err) {
        console.error(err)
      }
    },
    getTopSwaps(period) {
      switch (period) {
        case 'day':
          return this.$api.getTopSwaps()
        case 'month':
          return this.$api.getTopSwapsMonthly()
        case 'week':
          return this.$api.getTopSwapsWeekly()
      }
    },
    getVolume(props) {
      const inPrice = +props?.metadata?.swap?.inPriceUSD ?? 0
      const inAmount = +props?.in[0]?.coins[0].amount ?? 0
      return inPrice * inAmount
    },
    volumeSort(x, y, col, rowX, rowY) {
      return this.getVolume(rowX) < this.getVolume(rowY)
        ? -1
        : this.getVolume(rowX) > this.getVolume(rowY)
          ? 1
          : 0
    },
    downloadSwaps(data) {
      let swapsData = data
      if (data.actions && Array.isArray(data.actions)) {
        swapsData = data.actions
      } else if (Array.isArray(data)) {
        swapsData = data
      } else {
        console.error('Unexpected data structure:', data)
        return
      }

      if (!swapsData.length) {
        console.error('No swaps data available for CSV download.')
        return
      }

      const csvData = swapsData.map((swap) => {
        const inPrice = +swap?.metadata?.swap?.inPriceUSD ?? 0
        const inAmount = +swap?.in[0]?.coins[0]?.amount ?? 0
        const volume = inPrice * inAmount

        const nonAffiliateOuts = swap.out?.filter((out) => !out.affiliate) || []
        const firstNonAffiliateOut = nonAffiliateOuts[0]

        return {
          hash:
            swap.tx?.hash ||
            swap.hash ||
            swap.txHash ||
            swap.in?.[0]?.txID ||
            swap.tx?.id ||
            '',
          date: swap.tx?.date
            ? moment.unix(swap.tx.date).format('YYYY-MM-DD HH:mm:ss')
            : swap.date
              ? moment(swap.date / 1e6).format('YYYY-MM-DD HH:mm:ss')
              : '',
          volume: volume / 1e8,
          volumeUSD: this.$options.filters.number(volume / 1e8, '0,0.00a'),
          from: swap.in?.[0]?.address || '',
          to: firstNonAffiliateOut?.address || '',
          inAsset: swap.in[0]?.coins[0]?.asset || '',
          inAmount: (swap.in[0]?.coins[0]?.amount || 0) / 1e8,
          outAsset: firstNonAffiliateOut?.coins[0]?.asset || '',
          outAmount: (firstNonAffiliateOut?.coins[0]?.amount || 0) / 1e8,
        }
      })

      const csvContent = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map((row) =>
          Object.values(row)
            .map((value) => `"${value}"`)
            .join(',')
        ),
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      const period = this.tablePeriod
      const timestamp = moment().format('YYYY-MM-DD')

      link.setAttribute('href', url)
      link.setAttribute('download', `top-swaps-${period}-${timestamp}.csv`)
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
  },
}
</script>

<style lang="scss">
.header-top-swap {
  margin-top: 0.5rem;
}

.csv-download {
  margin-left: auto;
  cursor: pointer;
  display: flex;
  align-items: center;
  margin-right: 0.5rem;

  &:hover svg {
    fill: var(--primary-color);
  }

  svg {
    fill: var(--sec-font-color);
    height: 1.2rem;
    width: 1.2rem;
  }
}
</style>
