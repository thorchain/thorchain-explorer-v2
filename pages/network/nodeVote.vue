<template>
  <div>
    <cards-header :table-general-stats="generalStatsDetails" />
    <div class="card-container">
      <div v-for="(vote, index) in formattedVotes" :key="index" class="vote-card">
        <div class="card-header">
          <div class="key-name">{{ vote.value }}</div>
          <div v-if="vote.mimirValue !== undefined && vote.mimirValue !== 0" class="mimir-value">
            Current: <strong>{{ vote.mimirValue }}</strong>
          </div>
        </div>
        <div class="card-body">
          <div v-for="(addresses, key) in vote.keys" :key="key" class="vote-section">
            <div class="vote-header">
              <span class="key-list">{{ key == 0 ? 'Not Voted' : `Value: ${key}` }}</span>
              <div class="votes-list">
                <nuxt-link
                  v-for="(address, idx) in addresses.addresses.slice(0, 6)"
                  :key="idx"
                  :to="`/address/${address}`"
                  class="mini-bubble"
                  :style="{ backgroundColor: getColorForVote(vote.isPassed, key) }"
                >
                  {{ getLastFourCharacters(address) }}
                </nuxt-link>
                <button
                  v-if="addresses.addresses.length > 6 && !addresses.showAllVoted"
                  @click="addresses.showAllVoted = true"
                  class="more-button"
                >
                  +{{ addresses.addresses.length - 6 }} more
                </button>
                <nuxt-link
                  v-if="addresses.showAllVoted"
                  v-for="(address, idx) in addresses.addresses.slice(6)"
                  :key="idx + 6"
                  :to="`/address/${address}`"
                  class="mini-bubble"
                  :style="{ backgroundColor: getColorForVote(vote.isPassed, key) }"
                >
                  {{ getLastFourCharacters(address) }}
                </nuxt-link>
                <button
                  v-if="addresses.showAllVoted"
                  @click="addresses.showAllVoted = false"
                  class="more-button"
                >
                  Show Less
                </button>
              </div>
            </div>
            <div class="progress-section">
              <div v-if="vote.isPassed" class="active-status">
                <circleSuccess class="checkmark" />
                <span class="time-text">Active</span>
              </div>
              <span v-if="calculateProgress(addresses.addresses.length) !== '100%'" class="progress-text">
                {{ addresses.addresses.length }}/{{ votesRequired }} needed
              </span>
              <div v-if="calculateProgress(addresses.addresses.length) !== '100%'" class="progress-container">
                <div
                  :class="['progress-bar', getProgressBarClass(addresses.addresses.length)]"
                  :style="{ width: calculateProgress(addresses.addresses.length) }"
                ></div>
              </div>
              <div v-if="vote.changeIn24h !== 0" class="change-24h">
                24H Votes:
                <progress-icon :data-number="vote.changeIn24h" :is-down="vote.changeIn24h < 0" size="15.5px" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import circleSuccess from '~/assets/images/circle.svg?inline'

export default {
  components: {
    circleSuccess,
  },
  data() {
    return {
      loading: true,
      votes: [],
      activeNodes: [],
      votesRequired: 0,
      formattedVotes: [],
      generalStatsDetails: [
        { name: 'Active nodes'},
        { name: 'Votes required for change'},
      ],
      mimirData: {},
    }
  },
  async created() {
    try {
      await this.fetchVotes()
      await this.fetchNodes()
      await this.fetchMimirData()
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
        const response = await this.$api.getMimir()
        this.mimirData = response.data
      } catch (error) {
        console.error('Error fetching Mimir data:', error)
      }
    },
    async fetchVotes() {
      try {
        const response = await this.$api.getvotes()
        this.votes = response.data
        this.votes.forEach((vote) => {
          vote.votes.forEach((v) => {
            v.date = this.convertToDate(v.date)
          })
        })
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
    convertToDate(timestamp) {
      const milliseconds = parseInt(timestamp) / 1000000
      const date = new Date(milliseconds)
      return date.toLocaleString()
    },
    processVotes() {
      const groupedVotes = {}
      const now = new Date()
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

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
          const voteDate = new Date(v.date)
          if (!groupedVotes[vote.value].keys[v.key]) {
            groupedVotes[vote.value].keys[v.key] = {
              addresses: [],
              showAllVoted: false,
            }
          }
          groupedVotes[vote.value].keys[v.key].addresses.push(v.address)

          if (
            !groupedVotes[vote.value].recentVoteDate ||
            voteDate > groupedVotes[vote.value].recentVoteDate
          ) {
            groupedVotes[vote.value].recentVoteKey = v.key
            groupedVotes[vote.value].recentVoteDate = voteDate
          }

          if (voteDate > twentyFourHoursAgo) {
            groupedVotes[vote.value].votesInLast24h++
          } else if (
            voteDate >
            new Date(twentyFourHoursAgo.getTime() - 24 * 60 * 60 * 1000)
          ) {
            groupedVotes[vote.value].votesInPrevious24h++
          }
        })

        Object.keys(groupedVotes[vote.value].keys).forEach((key) => {
          if (
            groupedVotes[vote.value].keys[key].addresses.length >= this.votesRequired
          ) {
            groupedVotes[vote.value].isPassed = true
          }
        })
      })

      this.formattedVotes = Object.values(groupedVotes).map((vote) => ({
        ...vote,
        changeIn24h: vote.votesInLast24h - vote.votesInPrevious24h,
      }))
    },
    calculateProgress(votesCount) {
      const percentage = (votesCount / this.votesRequired) * 100
      return percentage + '%'
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
      const colors = [
        '#3498db',
        '#9b59b6',
        '#e84393',
        '#e67e22',
        '#e74c3c',
        '#f1c40f',
      ]
      const hash = key
        .split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 0)
      return colors[hash % colors.length]
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
.card-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.vote-card {
  background-color: var(--card-bg-color);
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  padding: 1rem;
  background-color: var(--border-color);
  border-bottom: 1px solid var(--border-color);
}

.key-name {
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--primary-font-color);
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

.vote-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
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
  margin-top: 0.5rem;
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
  transition: width 0.3s ease, background-color 0.3s ease;
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