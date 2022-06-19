<template>
  <Page>
    <Card title="⏰ Churn History" :isLoading="!churnHistory">
      <vue-good-table
        v-if="churnHistory"
        :columns="cols"
        :rows="churnHistory"
        styleClass="vgt-table net-table bordered"
        :pagination-options="{
          enabled: true,
          perPage: 30,
          perPageDropdownEnabled: false,
        }"
      >
        <template slot="table-row" slot-scope="props">
          <span v-if="props.column.field == 'timestamp'">
            {{timeFormat(props.row.timestamp)}}
            <span style="font-size: .75rem;">
              ({{fromNow(props.row.timestamp)}})
            </span> 
          </span>
          <span v-else>
            {{props.formattedRow[props.column.field]}}
          </span>
        </template>
      </vue-good-table>
      <span class="footer">
        Powered By <strong>Multipartite</strong>
      </span>
    </Card>
  </Page>
</template>

<script>
import moment from "moment";
import { momentTimeFormat } from '~/utils';

export default {
  data() {
    return {
      churnHistory: undefined,
      cols: [
        {
          label: 'Churn Occurred',
          field: 'timestamp',
        },
        {
          label: 'Block ID',
          field: 'BLOCK_ID',
          type: 'number',
          tdClass: 'mono',
          formatFn: this.normalFormat
        },
        {
          label: 'Churn Length (days)',
          field: 'DAYS_SINCE_LAST_CHURN',
          type: 'number',
          tdClass: 'mono',
        }
      ]
    }
  },
  mounted() {
    this.$api.getChurnHistory().then(({data}) => {
      this.churnHistory = data.map(d => ({...d, timestamp: moment(d.BLOCK_TIMESTAMP)}));;
    }).catch(e => {
      console.error(e);
    }) 
  },
  methods: {
    timeFormat(time) {
      return momentTimeFormat(time)
    },
    fromNow(time) {
      return moment(time)?.fromNow();
    }
  }
}
</script>

<style lang="scss">
.footer {
  display: block;
  margin: 1rem 0 0 .5rem;
}
</style>