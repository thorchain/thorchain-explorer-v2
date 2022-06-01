<template>
  <Page>
    <Card :isLoading="!currentVoting" title="Mimir Voting Overview">
      <vue-good-table
        v-if="votesCols && currentVoting"
        :columns="votesCols"
        :rows="currentVoting"
        styleClass="vgt-table net-table bordered"
        :pagination-options="{
          enabled: true,
          perPage: 30,
          perPageDropdownEnabled: false,
        }"
      >
        <template slot="table-row" slot-scope="props">
          <div v-if="props.column.field == 'result'" class="cell-content">
            <div :class="['bubble-container', {'yellow': props.row.result === 'In Progress'}]">
              {{props.row.result | capitalize}}
            </div>
          </div>
          <span v-else>
            {{props.formattedRow[props.column.field]}}
          </span>
        </template>
      </vue-good-table>
    </Card>
    <Card v-for="(v,k,i) in mimirVotes" :key="i" :title="`${k} Voters`">
      <vue-good-table
        v-if="cols && v.length > 0"
        :columns="cols"
        :rows="v"
        styleClass="vgt-table net-table vgt-compact"
        :pagination-options="{
          enabled: true,
          perPage: 30,
          perPageDropdownEnabled: false,
        }"
      >
        <template slot="table-row" slot-scope="props">
          <span v-if="props.column.field == 'signer'">
            <span class="clickable" @click="gotoNode(props.row.signer)">
              {{props.row.signer}}
            </span> 
          </span>
          <span v-else>
            {{props.formattedRow[props.column.field]}}
          </span>
        </template>
      </vue-good-table>
    </Card>
  </Page>
</template>

<script>
import { nodeCountQuery } from '~/_gql_queries';
import _ from 'lodash';
export default {
  data() {
    return {
      isLoading: true,
      mimirVotes: undefined,
      mimirs: undefined,
      cols: [
        {
          label: 'Signer',
          field: 'signer',
          sortable: false,
          tdClass: 'mono'
        },
        {
          label: 'Value',
          field: 'value',
          type: 'number',
          tdClass: 'mono'
        }
      ],
      votesCols: [
        {
          label: 'Vote',
          field: 'vote',
          sortable: false
        },
        {
          label: 'Current Mimir Value',
          field: 'currentVal',
          type: 'number',
          tdClass: 'mono'
        },
        {
          label: 'Highest Voted Value',
          field: 'highestValue',
          type: 'number',
          tdClass: 'mono'
        },
        {
          label: 'Voted',
          field: 'votePassed',
          type: 'number',
          tdClass: 'mono'
        },
        {
          label: 'Missing',
          field: 'remainingVotes',
          type: 'number',
          tdClass: 'mono'
        },
        {
          label: 'Consensus',
          field: 'consensus',
          type: 'percentage',
          tdClass: 'mono'
        },
        {
          label: 'Result',
          field: 'result',
          type: 'text',
        }
      ]
    }
  },
  mounted() {
    this.$api.getMimirVotes().then(res => {
      this.mimirVotes = this.formatVotes(res.data?.mimirs);
    }).catch(e => {
      console.error(e);
    })

    this.$api.getMimir().then(res => {
      this.mimirs = res.data;
    }).catch(e => {
      console.error(e);
    })
  },
  computed: {
    currentVoting: function() {
      if(this.mimirVotes && this.mimirs) {
        let mimrsVoteConstants = []
        for (let m of Object.keys(this.mimirs)) {
          if(Object.keys(this.mimirVotes).includes(m)) {
            const hVotes = this.getVoteHighestBid(this.mimirVotes[m]);
            mimrsVoteConstants.push({
              vote: m,
              currentVal: this.mimirs[m] == -1 ? '-':this.mimirs[m],
              highestValue: hVotes.value,
              consensus: hVotes.consensus,
              votePassed: hVotes.votePassed,
              remainingVotes: +this.network.activeNodeCount - hVotes.votePassed,
              result: (+this.mimirs[m] == +hVotes.value)? 'Passed':'In Progress'
            })
          }
        }
        return mimrsVoteConstants
      }
    }
  },
  methods: {
    formatVotes(mimirs) {
      let votes = {}
      for (let i in mimirs) {
        if (!(mimirs[i].key in votes)) {
          votes[mimirs[i].key] = [{
            signer: mimirs[i].signer,
            value: mimirs[i].value
          }]
        }
        else {
          votes[mimirs[i].key].push({
            signer: mimirs[i].signer,
            value: mimirs[i].value
          })
        }
      }
      return votes
    },
    gotoAddr(address) {
      this.$router.push({ path: `/address/${address}` })
    },
    gotoNode(signer) {
      this.$router.push({path: `/node/${signer}`});
    },
    getVoteHighestBid(voters) {
      if (!voters || voters.length == 0) {
        return
      }
      const activeVoters = voters.filter(v => this.nodes.filter(n => n.status == 'Active').map(n => n.address).includes(v.signer))
      const voteCount = _.countBy(activeVoters.map(v => v.value));
      const votesObj = Object.keys(voteCount).map((v, i) => (
        {
          value: v,
          count: voteCount[v],
          consensus: (voteCount[v]/(+this.network.activeNodeCount))
        }
      ));
      const hVote = _.maxBy(votesObj, (o) => o.consensus);
      return {
        consensus: hVote?.consensus ?? 0,
        votePassed: activeVoters?.length ?? 0,
        value: hVote?.value ?? '-'
      }
    }
  },
  apollo: {
    $prefetch: true,
    network: nodeCountQuery,
    nodes: nodeCountQuery
  }
}
</script>

<style lang="scss">
</style>