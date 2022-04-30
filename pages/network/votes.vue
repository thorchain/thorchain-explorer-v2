<template>
  <div class="votes-container">
    <div class="base-container">
      <h3>Current Constants</h3>
      <vue-good-table
        v-if="votesCols && currentVoting"
        :columns="votesCols"
        :rows="currentVoting"
        styleClass="vgt-table net-table vgt-compact"
        :pagination-options="{
          enabled: true,
          perPage: 30,
          perPageDropdownEnabled: false,
        }"
      />
    </div>
    <div class="vote-container base-container" v-for="(v,k,i) in mimirVotes" :key="i">
      <div class="vote-name">
        Vote: <span>{{k}}</span>
      </div>
      <div class="voters-container">
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
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
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
          label: 'Current Value',
          field: 'currentVal',
          type: 'number',
          tdClass: 'mono'
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
          console.log(m, this.mimirs[m])
          if(Object.keys(this.mimirVotes).includes(m)) {
            mimrsVoteConstants.push({
              vote: m,
              currentVal: this.mimirs[m],
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
  }
}
</script>

<style lang="scss">
.vote-container {
  margin: 1rem 0;

  .vote-name {
    color: #9f9f9f;
    padding: 1rem 0;

    span {
      color: var(--sec-font-color);
      font-weight: bold;
    }
  }

  .voters-container {
    .voter {
      padding: 0 1rem;
      margin: 1rem 0;
      display: flex;
      justify-content: space-between;

      &:first-of-type {
        margin-top: 0;
      }

      &:last-of-type {
        margin-bottom: 0;
      }

      .signer {
        cursor: pointer;
        color: var(--primary-color);
      }
    }

    .headers {
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-color);

      div {
        color: #9f9f9f;
      }
    }
  }
}
</style>