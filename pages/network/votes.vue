<template>
  <div class="votes-container">
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
          @on-row-click="gotoPoolTable"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      mimirVotes: undefined,
      cols: [
        {
          label: 'Signer',
          field: 'signer',
          sortable: false
        },
        {
          label: 'Value',
          field: 'value',
          type: 'number'
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
      color: #e6e6e6;
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
        color: #63FDD9;
      }
    }

    .headers {
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #263238;

      div {
        color: #9f9f9f;
      }
    }
  }
}
</style>