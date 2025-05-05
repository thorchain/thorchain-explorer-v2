<template>
  <div>
    <StatsPanel :metrics="governanceStats" />

    <h3 class="header-recent-vote">Latest Votes</h3>
    <div class="recent-votes-container">
      <div
        v-for="(vote, index) in recentVotes"
        :key="index"
        class="recent-vote-card"
      >
        <div class="recent-vote-content">
          <span class="vote-value">{{ vote.voteValue }} </span>
          <div class="key-name">
            <small>Value :</small>
            <b>{{ vote.value }}</b>
          </div>
          <div style="display: flex">
            <address-bar :address-str="vote.nodeAddress"></address-bar>
          </div>
        </div>
        <div class="vote-date">
          <small>Date:</small>
          <b>{{ formatDate(vote.date) }}</b>
        </div>
      </div>
    </div>

    <div class="search-container">
      <div id="vote-search-container">
        <input
          v-model="searchQuery"
          placeholder="Search by Mimir key or node address"
          class="search-input"
        />
        <SearchIcon class="search-icon" />
      </div>
      <div class="votes-container">
        <card
          v-for="(vote, index) in filteredVotes"
          :key="index"
          :title="vote.value"
        >
          <template #header>
            <div v-if="vote.mimirValue !== undefined" class="mini-bubble">
              Current:
              <strong style="margin-left: 5px">{{ vote.mimirValue }}</strong>
            </div>
          </template>
          <div class="vote-card">
            <div class="card-body">
              <div
                v-for="(o, key) in vote.keys"
                :key="key"
                class="vote-section"
              >
                <div class="progress-section">
                  <div class="progress-overtext">
                    <div class="key-name">
                      <small>Value :</small>
                      <b>{{ key }}</b>
                    </div>
                    <div class="key-name">
                      <span
                        v-if="isVotePassed(o, key, vote.value)"
                        class="mini-bubble"
                      >
                        Active
                      </span>
                      <b>{{ o.addresses.length }}</b>
                      <small>/ {{ votesRequired }}</small>
                    </div>
                  </div>
                  <progress-bar
                    :width="(o.addresses.length * 100) / votesRequired"
                    height="8px"
                  />
                </div>
                <div class="vote-footer">
                  <vote-list
                    :addresses="o.addresses"
                    :color="
                      getColorForVote(isVotePassed(o, key, vote.value), key)
                    "
                    :search-query="searchQuery"
                  ></vote-list>
                  <div v-if="o.votesInLast24h > 0" class="change-24h">
                    24H Votes:
                    <progress-icon
                      :data-number="o.votesInLast24h"
                      :is-down="false"
                      size="0.9rem"
                    />
                  </div>
                </div>
              </div>
              <div class="vote-section">
                <div class="progress-section">
                  <div class="progress-overtext">
                    <div class="key-name">
                      <small class="mini-bubble danger">Not Voted</small>
                    </div>
                    <div class="key-name">
                      <b>{{ vote.notVoted.length }}</b>
                      <small>/ {{ activeNodes.length }}</small>
                    </div>
                  </div>
                  <div class="vote-footer">
                    <vote-list
                      :addresses="vote.notVoted"
                      color="#e74c3c"
                      :search-query="searchQuery"
                    ></vote-list>
                  </div>
                </div>
              </div>
              <div class="vote-section">
                <div class="progress-section">
                  <div class="vote-footer"></div>
                  <div class="progress-overtext">
                    <div>
                      <span>Latest Vote:</span>
                      <strong>
                        {{ getHumanizeDuration(vote.latestVote / 1e6) }}
                      </strong>
                    </div>
                    <div>
                      <span>Earliest Vote:</span>
                      <strong>
                        {{ getHumanizeDuration(vote.earliestVote / 1e6) }}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </card>
      </div>
    </div>
    <div class="footer-stat" style="margin-top: 1rem">
      <small>
        <sup>*</sup>
        Vote keys are sorted by the latest vote date.
      </small>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import SearchIcon from '~/assets/images/search.svg?inline'

export default {
  components: {
    SearchIcon,
  },
  data() {
    return {
      loading: true,
      votes: [],
      recentVotes: [],
      activeNodes: [],
      votesRequired: 0,
      formattedVotes: [],
      generalStatsDetails: [{ name: 'Active nodes' }, { name: 'Consensus' }],
      mimirData: {},
      searchQuery: '',
      last24HVotes: 0,
    }
  },
  computed: {
    filteredVotes() {
      if (!this.searchQuery) {
        return this.formattedVotes
      }
      const query = this.searchQuery.toLowerCase()
      return this.formattedVotes.filter((vote) => {
        if (vote.value.toLowerCase().includes(query)) {
          return true
        }
        for (const key in vote.keys) {
          if (
            vote.keys[key].addresses.some((address) =>
              address.toLowerCase().includes(query)
            )
          ) {
            return true
          }
        }
        return false
      })
    },
    governanceStats() {
      return [
        {
          label: 'Active Nodes',
          value: this.activeNodes.length,
        },
        {
          label: 'Consensus',
          value: this.votesRequired,
        },
        {
          label: '24H Votes',
          value: this.last24HVotes,
        },
        {
          label: 'Latest Vote',
          value: this.formattedVotes[0]?.value || '-',
        },
        {
          label: '30D Proposals',
          value: this.votes.length,
        },
      ]
    },
  },
  async mounted() {
    try {
      await Promise.all([
        this.fetchVotes(),
        this.fetchNodes(),
        this.fetchMimirData(),
      ])
      this.processVotes()
      this.updateStatsDetails()
      this.updateRecentVotes()
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      this.loading = false
    }
  },
  methods: {
    async fetchMimirData() {
      try {
        this.mimirData = (await this.$api.getMimir())?.data
      } catch (error) {
        console.error('Error fetching Mimir data:', error)
      }
    },
    async fetchVotes() {
      try {
        this.votes = (await this.$api.getVotes())?.data
      } catch (error) {
        console.error('Error fetching votes:', error)
      }
    },
    async fetchNodes() {
      try {
        const { data } = await this.$api.getNodes()
        this.activeNodes = data
          .filter((node) => node.status === 'Active')
          .map((node) => node.node_address)
        this.votesRequired = Math.floor((this.activeNodes.length * 2) / 3) + 1
      } catch (error) {
        console.error('Error fetching nodes:', error)
      }
    },
    processVotes() {
      const twentyFourHoursAgo = moment().subtract(24, 'hours')

      const votes = []
      for (let i = 0; i < this.votes.length; i++) {
        const vote = this.votes[i]

        const voteInfo = {
          value: vote.value,
          keys: {},
          latestVote: +vote.votes[0].date,
          earliestVote: +vote.votes[vote.votes.length - 1].date,
          mimirValue: this.mimirData[vote.value],
          notVoted: [...this.activeNodes],
        }

        for (let j = 0; j < vote.votes.length; j++) {
          const { key, date, address } = vote.votes[j]
          const formattedDate = moment(date / 1e6)

          if (!voteInfo.keys[key]) {
            voteInfo.keys[key] = {
              addresses: [],
              votesInLast24h: 0,
            }
          }

          const delIndex = voteInfo.notVoted.indexOf(address)
          if (delIndex === -1) {
            continue
          }

          voteInfo.keys[key].addresses.push(address)
          voteInfo.notVoted.splice(delIndex, 1)

          if (formattedDate.isAfter(twentyFourHoursAgo)) {
            voteInfo.keys[key].votesInLast24h += 1
            this.last24HVotes++
          }
        }

        votes.push(voteInfo)
      }

      this.formattedVotes = votes.sort((a, b) => {
        return b.latestVote - a.latestVote
      })
    },
    updateRecentVotes() {
      const recentVotes = []
      for (let i = 0; i < this.votes.length; i++) {
        const vote = this.votes[i]
        for (let j = 0; j < vote.votes.length; j++) {
          const { key, date, address } = vote.votes[j]
          recentVotes.push({
            nodeAddress: address,
            voteValue: vote.value,
            value: key,
            date: date / 1e6,
          })
        }
      }
      this.recentVotes = recentVotes
        .sort((a, b) => b.date - a.date)
        .slice(0, 10)
    },
    formatDate(date) {
      return moment(date).format('MM/DD/YYYY HH:mm:ss')
    },
    isVotePassed(o, key, value) {
      if (this.mimirData[value] === +key) return true
      if (this.votesRequired <= o.addresses.length) return true
      return false
    },
    getColorForVote(isPassed, key) {
      if (isPassed) return '#2ecc71'
      const colors = [
        '#3498db',
        '#9b59b6',
        '#e84393',
        '#e67e22',
        '#e74c3c',
        '#f1c40f',
      ]
      return colors[+key % colors.length]
    },
    updateStatsDetails() {
      this.generalStatsDetails = [
        {
          name: 'Active nodes',
          value: this.activeNodes.length.toLocaleString(),
        },
        {
          name: 'Consensus',
          value: this.votesRequired,
        },
        {
          name: '24HR Votes',
          value: this.last24HVotes,
        },
        {
          name: 'Latest Vote',
          value: this.formattedVotes[0]?.value,
        },
        {
          name: 'Past 30D Proposals',
          value: this.votes.length,
        },
      ]

      this.infoCardOptions = [
        {
          title: 'Voting Governance',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'Active nodes',
              value: this.activeNodes.length.toLocaleString(),
            },
            {
              name: 'Consensus',
              value: this.votesRequired,
            },
            {
              name: '24HR Votes',
              value: this.last24HVotes,
            },
            {
              name: 'Latest Vote',
              value: this.formattedVotes[0]?.value,
            },
            {
              name: 'Past 30D Proposals',
              value: this.votes.length,
            },
          ],
        },
      ]
    },
  },
}
</script>

<style scoped lang="scss">
.votes-container {
  display: flex;
  flex-wrap: wrap;
  gap: $space-16;

  .card-container {
    min-width: 100%;
    margin: $space-0;

    @include md {
      min-width: 520px;
    }
  }
}

.search-container {
  display: flex;
  flex-direction: column;
  gap: $space-8;
}

#vote-search-container {
  display: flex;
  position: relative;
  flex: 1;
  margin: $space-8 $space-10;

  @include lg {
    margin: $space-8 $space-0;
  }

  .search-input {
    flex: 1;
    color: var(--sec-font-color);
    background-color: var(--bg-color);
    border: 1px solid var(--border-color) !important;
    border-radius: $radius-lg;
    outline: none;
    margin: $space-2;
    padding: $space-12;
    font-size: $font-size-mobile;
    font-weight: 450;

    &:focus {
      border-color: transparent;
      box-shadow: 0 0 0 0.15rem rgba(255, 255, 255, 0.1);
      color: var(--primary-color);
    }
  }

  .search-icon {
    position: absolute;
    width: 20px;
    height: 24px;
    fill: var(--font-color);
    right: 0.8rem;
    top: calc(50% - 0.8rem);
    cursor: pointer;
    transition: fill 0.3s ease;
    box-sizing: content-box;
    background: var(--card-bg-color);
    padding-left: $space-5;
  }
}

.mimir-value {
  font-size: $font-size-sm;
  color: var(--sec-font-color);
  margin-top: $space-8;
}

.card-body {
  padding: $space-16;
}

.vote-section {
  margin-bottom: $space-16;
}

.vote-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: $space-8;
  flex-wrap: wrap;
  gap: $space-8;
}

.key-list {
  font-size: $font-size-sm;
  color: var(--sec-font-color);
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .progress-overtext {
    display: flex;
    justify-content: space-between;
    font-size: $font-size-sm;

    .key-name {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      b {
        color: var(--sec-font-color);
      }

      small {
        color: var(--font-color);
      }
    }
  }
}

.active-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--success-color);
}

.checkmark {
  width: 1rem;
  height: 1rem;
}

.progress-text {
  font-size: $font-size-xs;
  color: var(--sec-font-color);
}

.progress-container {
  width: 210px;
  height: 8px;
  background-color: var(--border-color);
  border-radius: $radius-sm;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  transition:
    width 0.3s ease,
    background-color 0.3s ease;
}

.progress-bar.over-half {
  background-color: #f1c40f;
}

.progress-bar.complete {
  background-color: #2ecc71;
}

.change-24h {
  font-size: $font-size-xs;
  color: var(--sec-font-color);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.header-recent-vote {
  color: var(--sec-font-color);
  margin: $space-18 $space-12;

  @include lg {
    margin: $space-18 $space-0;
  }
}
.recent-votes-container {
  display: flex;
  flex-direction: row;
  overflow: auto;
  padding-bottom: $space-8;
  margin-bottom: $space-8;
  gap: $space-8;
  margin: $space-0 $space-10;

  @include lg {
    margin: $space-0;
  }
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) var(--bg-color);
  &::-webkit-scrollbar {
    height: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--border-color);
    border-radius: $radius-sm;
  }

  &::-webkit-scrollbar-track {
    background-color: var(--bg-color);
  }
}

.recent-vote-card {
  background: var(--bg-color);
  border: 1px solid var(--border-color) !important;
  border-radius: $radius-lg;
  padding: $space-16;
  min-width: 250px;
  flex: 0 0 auto;
  .recent-vote-content {
    display: flex;
    gap: 0.5rem;
    flex-direction: column;
  }

  .vote-value {
    font-size: $font-size-md;
    font-weight: 600;
    color: var(--sec-font-color);
  }

  .key-name {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: $font-size-sm;

    small {
      color: var(--sec-font-color);
      font-weight: 400;
    }

    b {
      color: var(--sec-font-color);
      font-weight: 500;
    }
  }
  .vote-date {
    font-size: $font-size-sm;
    color: var(--sec-font-color);
    margin-top: $space-8;
  }

  .node-address {
    font-size: $font-size-sm;
    color: var(--sec-font-color);
    word-break: break-all;
    margin-top: $space-8;
  }
}
</style>
