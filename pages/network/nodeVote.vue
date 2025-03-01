<template>
  <div>
    <cards-header :table-general-stats="generalStatsDetails" />

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
          <div
            v-if="vote.mimirValue !== undefined && vote.mimirValue !== 0"
            class="mini-bubble"
          >
            Current: <strong>{{ vote.mimirValue }}</strong>
          </div>
        </template>
        <div class="vote-card">
          <div class="card-body">
            <div
              v-for="(addresses, key) in vote.keys"
              :key="key"
              class="vote-section"
            >
              <div class="progress-section">
                <!-- <div v-if="vote.isPassed" class="active-status">
                  <circleSuccess class="checkmark" />
                  <span class="time-text">Active</span>
                </div> -->

                <div class="progress-overtext">
                  <div class="key-name">
                    <small>Value :</small>
                    <b>{{ key }}</b>
                  </div>
                  <div class="key-name">
                    <b>{{ addresses.addresses.length }}</b>
                    <small> /{{ votesRequired }} </small>
                  </div>
                </div>
                <progress-bar
                  :width="(addresses.addresses.length * 100) / votesRequired"
                  height="8px"
                />
              </div>
              <div class="vote-footer">
                <div class="votes-list">
                  <nuxt-link
                    v-for="(address, idx) in addresses.addresses.slice(0, 6)"
                    :key="idx"
                    :to="`/address/${address}`"
                    class="mini-bubble"
                    :style="{
                      backgroundColor: getColorForVote(vote.isPassed, key),
                    }"
                  >
                    {{ getLastFourCharacters(address) }}
                  </nuxt-link>
                  <button
                    v-if="
                      addresses.addresses.length > 6 && !addresses.showAllVoted
                    "
                    class="more-button"
                    @click="addresses.showAllVoted = true"
                  >
                    +{{ addresses.addresses.length - 6 }} more
                  </button>
                  <nuxt-link
                    v-for="(address, idx) in addresses.addresses.slice(6)"
                    v-if="addresses.showAllVoted"
                    :key="idx + 6"
                    :to="`/address/${address}`"
                    class="mini-bubble"
                    :style="{
                      backgroundColor: getColorForVote(vote.isPassed, key),
                    }"
                  >
                    {{ getLastFourCharacters(address) }}
                  </nuxt-link>
                  <button
                    v-if="addresses.showAllVoted"
                    class="more-button"
                    @click="addresses.showAllVoted = false"
                  >
                    Show Less
                  </button>
                </div>
                <div v-if="vote.changeIn24h !== 0" class="change-24h">
                  24H Votes:
                  <progress-icon
                    :data-number="vote.changeIn24h"
                    :is-down="vote.changeIn24h < 0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </card>
    </div>
  </div>
</div>
</template>

<script>
import moment from 'moment'
import circleSuccess from '~/assets/images/circle.svg?inline'
import SearchIcon from '~/assets/images/search.svg?inline'

export default {
  components: {
    circleSuccess,
    SearchIcon,
  },
  data() {
    return {
      loading: true,
      votes: [],
      activeNodes: [],
      votesRequired: 0,
      formattedVotes: [],
      generalStatsDetails: [
        { name: 'Active nodes' },
        { name: 'Votes required for change' },
      ],
      mimirData: {},
      searchQuery: '',
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
        this.votes = (await this.$api.getvotes())?.data
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
      const groupedVotes = {}
      const twentyFourHoursAgo = moment().subtract(24, 'hours')

      this.votes.forEach((vote) => {
        if (!groupedVotes[vote.value]) {
          groupedVotes[vote.value] = {
            value: vote.value,
            keys: {},
            isPassed: false,
            recentVoteKey: null,
            recentVoteDate: null,
            votesInLast24h: 0,
            votesInPrevious24h: 0,
            mimirValue: this.mimirData[vote.value],
          }
        }

        vote.votes.forEach((v) => {
          const voteDate = moment(+v.date / 1e6)

          if (!groupedVotes[vote.value].keys[v.key]) {
            groupedVotes[vote.value].keys[v.key] = {
              addresses: [],
              showAllVoted: false,
            }
          }
          groupedVotes[vote.value].keys[v.key].addresses.push(v.address)

          if (voteDate.isAfter(twentyFourHoursAgo)) {
            groupedVotes[vote.value].votesInLast24h++
          } else {
            groupedVotes[vote.value].votesInPrevious24h++
          }
        })

        Object.keys(groupedVotes[vote.value].keys).forEach((key) => {
          if (
            groupedVotes[vote.value].keys[key].addresses.length >=
            this.votesRequired
          ) {
            groupedVotes[vote.value].isPassed = true
          }
        })
      })

      this.formattedVotes = Object.values(groupedVotes).map((vote) => ({
        ...vote,
        changeIn24h: vote.votesInLast24h,
      }))
    },
    calculateProgress(votesCount) {
      return (votesCount / this.votesRequired) * 100
    },
    getProgressBarClass(votesCount) {
      const percentage = votesCount / this.votesRequired
      if (percentage >= 1) return 'progress-bar complete'
      if (percentage >= 0.5) return 'progress-bar over-half'
      return 'progress-bar'
    },
    getLastFourCharacters(address) {
      return address.slice(-4)
    },
    getColorForVote(isPassed, key) {
      if (isPassed) return '#2ecc71'
      return this.createColor(key)
    },
    updateStatsDetails() {
      this.generalStatsDetails = [
        {
          name: 'Active nodes',
          value: this.activeNodes.length.toLocaleString(),
        },
        {
          name: 'Votes required for change',
          value: this.votesRequired.toLocaleString(),
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
  gap: 1rem;

  .card-container {
    min-width: 100%;

    @include md {
      min-width: 520px;
    }
  }
}
.search-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
#vote-search-container {
  display: flex;
  position: relative;
  flex: 1;

  .search-input {
    flex: 1;
    color: var(--sec-font-color);
    background-color: var(--bg-color);
    border: 1px solid var(--border-color) !important;
    border-radius: 0.5rem;
    outline: none;
    margin: 2px;
    padding: 12px;
    font-size: 0.9062rem;
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
    padding-left: 0.3rem;
  }
}

.mimir-value {
  font-size: 0.875rem;
  color: var(--sec-font-color);
  margin-top: 0.5rem;
}

.card-body {
  padding: 1rem;
}

.vote-section {
  margin-bottom: 1rem;
}

.vote-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.key-list {
  font-size: 0.875rem;
  color: var(--sec-font-color);
}

.votes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.mini-bubble {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  color: var(--sec-font-color);
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 0.8;
  }
}

.more-button {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  font-size: 0.75rem;
  transition: color 0.3s ease;

  &:hover {
    color: var(--primary-color-dark);
  }
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .progress-overtext {
    display: flex;
    justify-content: space-between;

    .key-name {
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
  font-size: 0.75rem;
  color: var(--sec-font-color);
}

.progress-container {
  width: 210px;
  height: 8px;
  background-color: var(--border-color);
  border-radius: 4px;
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
  font-size: 0.75rem;
  color: var(--sec-font-color);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
</style>
