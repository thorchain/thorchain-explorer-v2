<template>
  <div class="mv">
    <div class="mv-head">
      <p class="mv-sub">
        Every Mimir key node operators are voting on, and how close each one is
        to taking effect.
      </p>
      <span v-if="thorHeight" class="mv-live">
        <span class="mv-live__dot" />
        Live · block
        <span class="mono mv-strong">{{ thorHeight | number('0,0') }}</span>
      </span>
    </div>

    <div class="mv-stats">
      <div class="mv-stat">
        <span class="mv-label">Active nodes</span>
        <span class="mv-stat__value mono">{{ activeNodes.length }}</span>
        <span class="mv-stat__sub">
          {{ distinctOperators }} distinct operators
        </span>
      </div>
      <div class="mv-stat">
        <span class="mv-label">Thresholds</span>
        <span class="mv-stat__value mono">
          {{ operationalVotesMin }} <span class="mv-faint">/</span>
          {{ votesRequired }}
        </span>
        <span class="mv-stat__sub">operational / economic</span>
      </div>
      <div class="mv-stat">
        <span class="mv-label">Votes · 24h</span>
        <span class="mv-stat__value mono">{{ last24HVotes }}</span>
        <span
          :class="[
            'mv-stat__sub',
            { 'is-up': votesDelta > 0, 'is-down': votesDelta < 0 },
          ]"
        >
          {{ votesDeltaText }}
        </span>
      </div>
      <div class="mv-stat">
        <span class="mv-label">Keys in motion</span>
        <span class="mv-stat__value mono">
          {{ keysInMotion }}
          <span class="mv-stat__of">of {{ formattedVotes.length }}</span>
        </span>
        <span class="mv-stat__sub">voted on in the last 7d</span>
      </div>
    </div>

    <div v-if="upgrade" :class="['mv-upgrade', { 'is-ok': upgrade.approved }]">
      <div class="mv-upgrade__top">
        <span class="mv-upgrade__title">
          <span class="mv-tag mv-tag--blue">Upgrade</span>
          <span class="mv-upgrade__name">{{ upgrade.name }}</span>
          <span v-if="upgrade.approved" class="mv-pill mv-pill--green">
            Quorum reached
          </span>
        </span>
        <span v-if="upgrade.height" class="mv-dim">
          Activates
          <template v-if="upgradeEta">
            <span class="mv-strong">in ~{{ upgradeEta }}</span> ·
          </template>
          block
          <span class="mono mv-strong">{{
            upgrade.height | number('0,0')
          }}</span>
        </span>
      </div>
      <div class="mv-upgrade__body">
        <div class="mv-upgrade__row">
          <span class="mv-dim">Approvals</span>
          <span
            :class="[
              'mono',
              'mv-upgrade__count',
              { 'is-ok': upgrade.approved },
            ]"
          >
            {{ upgrade.approvals }}
            <span class="mv-faint">/ {{ votesRequired }} needed</span>
          </span>
        </div>
        <div class="mv-bar mv-bar--lg">
          <span
            :class="['mv-bar__fill', upgrade.approved ? 'is-green' : 'is-blue']"
            :style="{ width: upgrade.percent + '%' }"
          />
          <span class="mv-bar__marker" :style="{ left: upgradeMarker + '%' }" />
        </div>
        <span class="mv-muted">
          Marker is the {{ votesRequired }}-node threshold ·
          <template v-if="upgrade.validators_to_quorum > 0">
            {{ upgrade.validators_to_quorum }} more nodes needed
          </template>
          <template v-else>quorum reached</template>
        </span>
      </div>
    </div>

    <div class="mv-toolbar">
      <div class="mv-chips" role="group" aria-label="Filter by mimir type">
        <button
          v-for="t in typeFilters"
          :key="t.id"
          type="button"
          :class="['mv-chip', { 'is-on': typeFilter === t.id }]"
          :aria-pressed="typeFilter === t.id ? 'true' : 'false'"
          @click="setTypeFilter(t.id)"
        >
          <span v-if="t.dot" :class="['mv-dot', t.dot]" />
          {{ t.label }}
          <span v-if="t.count !== undefined" class="mono mv-faint">
            {{ t.count }}
          </span>
        </button>
      </div>
      <label class="mv-search">
        <SearchIcon class="mv-search__icon" aria-hidden="true" />
        <span class="sr-only">Search votes</span>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search a key, node or operator"
        />
      </label>
      <label class="mv-sort">
        <span>Sort:</span>
        <select v-model="sortBy" aria-label="Sort votes">
          <option value="latest">latest vote</option>
          <option value="threshold">closest to threshold</option>
          <option value="votes">most votes</option>
          <option value="name">key name</option>
        </select>
      </label>
    </div>

    <div class="mv-table">
      <div class="mv-grid mv-grid--head">
        <span class="mv-label">Vote key</span>
        <span class="mv-label">Leading value</span>
        <span class="mv-label">Toward threshold</span>
        <span class="mv-label">Status</span>
        <span class="mv-label">Last vote</span>
        <span />
      </div>

      <div v-if="loading" class="mv-empty">Loading votes…</div>
      <div v-else-if="!visibleVotes.length" class="mv-empty">
        No keys match this filter.
      </div>

      <template v-for="vote in pagedVotes">
        <button
          :key="vote.value"
          type="button"
          :class="['mv-grid', 'mv-row', { 'is-open': isOpen(vote) }]"
          :aria-expanded="isOpen(vote) ? 'true' : 'false'"
          @click="toggle(vote)"
        >
          <span class="mv-cell mv-cell--key">
            <span class="mv-key" :title="vote.value">{{ vote.value }}</span>
            <span class="mv-meta">
              <span
                :class="[
                  'mv-type',
                  vote.operational ? 'is-blue-text' : 'is-orange-text',
                ]"
              >
                <span
                  :class="[
                    'mv-dot',
                    vote.operational ? 'is-blue' : 'is-orange',
                  ]"
                />
                {{ vote.operational ? 'Operational' : 'Economic' }}
              </span>
              <span class="mono mv-muted">
                <template v-if="vote.mimirValue === undefined">
                  current — not set
                </template>
                <template v-else>
                  current
                  <b class="mv-current">{{
                    getVoteKeyLabel(vote.value, String(vote.mimirValue))
                  }}</b>
                </template>
              </span>
            </span>
          </span>

          <span class="mv-cell mv-cell--leading">
            <template v-if="vote.leading">
              <span class="mono mv-value">{{ vote.leading.label }}</span>
              <span
                v-if="vote.values.length > 1"
                class="mv-muted is-orange-text"
              >
                contested · {{ vote.values.length }} values
              </span>
              <span v-else class="mv-muted">
                {{ vote.leading.count }}
                {{ vote.leading.count === 1 ? 'node agrees' : 'nodes agree' }}
              </span>
            </template>
            <span v-else class="mv-muted">No standing votes</span>
          </span>

          <span class="mv-cell mv-cell--bar">
            <span class="mv-bar">
              <span
                :class="['mv-bar__fill', barClass(vote)]"
                :style="{ width: vote.progress + '%' }"
              />
              <template v-if="vote.runnerUpProgress">
                <span class="mv-bar__gap" />
                <span
                  class="mv-bar__fill is-grey"
                  :style="{ width: vote.runnerUpProgress + '%' }"
                />
              </template>
            </span>
            <span class="mono mv-dim mv-small">
              {{ vote.leading ? vote.leading.count : 0 }} /
              {{ vote.required }} ·
              <span v-if="vote.status === 'effect'" class="is-green-text">
                passed
              </span>
              <span v-else-if="vote.values.length > 1" class="mv-faint"
                >{{ vote.values[1].count }} on {{ vote.values[1].label }}</span
              >
              <span v-else class="is-orange-text">
                {{ vote.short }} short
              </span>
            </span>
          </span>

          <span class="mv-cell mv-cell--status">
            <span :class="['mv-pill', statusMeta(vote).cls]">
              <span v-if="statusMeta(vote).pulse" class="mv-pill__dot" />
              {{ statusMeta(vote).label }}
            </span>
            <span v-if="vote.recent24h" class="mv-muted is-orange-text">
              {{ vote.recent24h }} vote{{ vote.recent24h > 1 ? 's' : '' }} in
              24h
            </span>
          </span>

          <span class="mv-cell mv-cell--last">
            <span class="mv-strong mv-small">
              {{ getHumanizeDuration(vote.latestVote / 1e6) }}
            </span>
            <span class="mono mv-muted">{{
              formatDate(vote.latestVote / 1e6)
            }}</span>
          </span>

          <span class="mv-caret" aria-hidden="true">
            {{ isOpen(vote) ? '−' : '+' }}
          </span>
        </button>

        <div
          v-if="isOpen(vote)"
          :key="vote.value + '-detail'"
          class="mv-detail"
        >
          <div class="mv-panel mv-voters">
            <div class="mv-panel__head">
              <span class="mv-label">Voters</span>
              <span class="mono mv-small is-green-text">
                {{ vote.votedCount }} nodes · {{ vote.voters.length }} counted
                votes
              </span>
            </div>
            <div v-if="vote.values.length" class="mv-values">
              <span
                v-for="v in vote.values"
                :key="v.key"
                :class="['mv-value-chip', { 'is-on': v.passed }]"
              >
                <span class="mono mv-strong">{{ v.label }}</span>
                <span class="mono mv-faint">{{ v.count }}</span>
                <span v-if="v.passed" class="is-green-text">active</span>
              </span>
            </div>
            <div class="mv-vgrid mv-vgrid--head">
              <span>Node</span>
              <span>Operator</span>
              <span>Value</span>
              <span>When</span>
            </div>
            <div
              v-for="voter in shownVoters(vote)"
              :key="voter.address"
              :class="['mv-vgrid', { 'is-hit': voterMatches(voter) }]"
            >
              <nuxt-link
                :to="`/node/${voter.address}`"
                class="mono mv-strong mv-link"
                :title="voter.address"
              >
                {{ voter.address.slice(-4) }}
              </nuxt-link>
              <nuxt-link
                v-if="operators[voter.address]"
                :to="`/address/${operators[voter.address]}`"
                class="mono mv-link"
                :title="operators[voter.address]"
              >
                {{ operators[voter.address].slice(-4) }}
              </nuxt-link>
              <span v-else class="mv-faint">—</span>
              <span
                :class="[
                  'mono',
                  voter.withdrawn ? 'is-orange-text' : 'mv-strong',
                ]"
              >
                {{ getVoteKeyLabel(vote.value, voter.key) }}
              </span>
              <span class="mono mv-muted">{{
                formatDate(voter.date / 1e6)
              }}</span>
            </div>
            <button
              v-if="vote.voters.length > voterLimit"
              type="button"
              class="mv-more"
              @click="toggleVoters(vote)"
            >
              {{
                allVoters[vote.value]
                  ? 'Show fewer voters'
                  : `Show ${vote.voters.length - voterLimit} more voters`
              }}
            </button>
          </div>

          <div class="mv-side">
            <div class="mv-panel mv-panel--pad">
              <div class="mv-panel__head mv-panel__head--flat">
                <span class="mv-label">Not yet voted</span>
                <span class="mono mv-small mv-dim">
                  {{ vote.notVoted.length }} nodes
                </span>
              </div>
              <div class="mv-nodes">
                <nuxt-link
                  v-for="addr in shownNotVoted(vote)"
                  :key="addr"
                  :to="`/node/${addr}`"
                  :class="['mv-node', { 'is-hit': matchesSearch(addr) }]"
                  :title="addr"
                >
                  {{ addr.slice(-4) }}
                </nuxt-link>
                <button
                  v-if="vote.notVoted.length > notVotedLimit"
                  type="button"
                  class="mv-node mv-node--more"
                  @click="toggleNotVoted(vote)"
                >
                  {{
                    allNotVoted[vote.value]
                      ? 'Show less'
                      : `+${vote.notVoted.length - notVotedLimit} more`
                  }}
                </button>
              </div>
              <p class="mv-muted mv-note">
                Silence is not a rejection — a node that has not voted on this
                key has no stance recorded.
              </p>
            </div>

            <div class="mv-panel mv-panel--pad mv-timing">
              <span class="mv-label">Effective value</span>
              <span class="mv-dim mv-text">
                <template v-if="vote.mimirValue === undefined">
                  Not set. The key takes effect once {{ vote.required }} nodes
                  agree on a single value.
                </template>
                <template v-else>
                  Currently
                  <span class="mono mv-strong">{{
                    getVoteKeyLabel(vote.value, String(vote.mimirValue))
                  }}</span
                  >.
                  <template v-if="vote.status !== 'effect' && vote.leading">
                    {{ vote.short }} more votes on
                    <span class="mono mv-strong">{{ vote.leading.label }}</span>
                    would change it.
                  </template>
                </template>
              </span>
              <div class="mv-timing__row">
                <span class="mv-timing__item">
                  <span class="mv-muted">First vote</span>
                  <span class="mv-strong mv-small">
                    {{ getHumanizeDuration(vote.earliestVote / 1e6) }}
                  </span>
                </span>
                <span class="mv-timing__item">
                  <span class="mv-muted">Latest vote</span>
                  <span class="mv-strong mv-small">
                    {{ getHumanizeDuration(vote.latestVote / 1e6) }}
                  </span>
                </span>
                <span class="mv-timing__item">
                  <span class="mv-muted">Pace</span>
                  <span
                    :class="[
                      'mv-small',
                      vote.recent24h ? 'is-green-text' : 'mv-dim',
                    ]"
                  >
                    +{{ vote.recent24h }} in 24h
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div v-if="visibleVotes.length" class="mv-foot">
        <span class="mv-muted">
          Showing {{ pagedVotes.length }} of {{ visibleVotes.length }} keys ·
          votes from the last 30 days
        </span>
        <button
          v-if="pagedVotes.length < visibleVotes.length"
          type="button"
          class="mv-btn"
          @click="pageCount++"
        >
          Load more
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import { debounce } from 'lodash'
import { mapGetters } from 'vuex'
import SearchIcon from '~/assets/images/search.svg?inline'
import {
  isOperationalMimir,
  isVoteWithdrawal,
  requiredVotes,
  DEFAULT_OPERATIONAL_VOTES_MIN,
} from '~/utils/mimir'

const PAGE_SIZE = 20

export default {
  components: {
    SearchIcon,
  },
  data() {
    return {
      loading: true,
      votes: [],
      activeNodes: [],
      operators: {},
      votesRequired: 0,
      formattedVotes: [],
      mimirData: {},
      upgradeProposals: [],
      searchQuery: this.$route.query.search || '',
      typeFilter: 'all',
      sortBy: 'latest',
      pageCount: 1,
      openKeys: {},
      allVoters: {},
      allNotVoted: {},
      voterLimit: 6,
      notVotedLimit: 12,
      last24HVotes: 0,
      prev24HVotes: 0,
    }
  },
  computed: {
    ...mapGetters({
      chainsHeight: 'getChainsHeight',
    }),
    thorHeight() {
      return this.chainsHeight?.THOR
    },
    query() {
      return this.searchQuery.trim().toLowerCase()
    },
    typeFilters() {
      const economic = this.formattedVotes.filter((v) => !v.operational).length
      return [
        { id: 'all', label: 'All types' },
        {
          id: 'economic',
          label: 'Economic',
          dot: 'is-orange',
          count: economic,
        },
        {
          id: 'operational',
          label: 'Operational',
          dot: 'is-blue',
          count: this.formattedVotes.length - economic,
        },
      ]
    },
    visibleVotes() {
      let list = this.formattedVotes
      if (this.typeFilter !== 'all') {
        const op = this.typeFilter === 'operational'
        list = list.filter((v) => v.operational === op)
      }
      if (this.query) {
        list = list.filter(
          (v) =>
            v.value.toLowerCase().includes(this.query) ||
            this.addressHit(v) !== undefined
        )
      }
      const sorted = [...list]
      switch (this.sortBy) {
        case 'threshold':
          // Keys still gathering come first, nearest to passing on top.
          sorted.sort(
            (a, b) =>
              (a.status === 'effect') - (b.status === 'effect') ||
              b.ratio - a.ratio
          )
          break
        case 'votes':
          sorted.sort((a, b) => b.votedCount - a.votedCount)
          break
        case 'name':
          sorted.sort((a, b) => a.value.localeCompare(b.value))
          break
        default:
          sorted.sort((a, b) => b.latestVote - a.latestVote)
      }
      return sorted
    },
    pagedVotes() {
      return this.visibleVotes.slice(0, this.pageCount * PAGE_SIZE)
    },
    operationalVotesMin() {
      const v = this.mimirData?.OPERATIONALVOTESMIN
      return v !== undefined && v !== null ? +v : DEFAULT_OPERATIONAL_VOTES_MIN
    },
    distinctOperators() {
      return new Set(
        this.activeNodes.map((a) => this.operators[a]).filter(Boolean)
      ).size
    },
    votesDelta() {
      return this.last24HVotes - this.prev24HVotes
    },
    votesDeltaText() {
      const d = this.votesDelta
      if (d > 0) return `↑ ${d} more than the day before`
      if (d < 0) return `↓ ${-d} fewer than the day before`
      return 'same as the day before'
    },
    keysInMotion() {
      const weekAgo = moment().subtract(7, 'days').valueOf()
      return this.formattedVotes.filter((v) => v.latestVote / 1e6 > weekAgo)
        .length
    },
    upgrade() {
      const height = this.thorHeight
      const list = (this.upgradeProposals || []).filter(
        (p) => !height || !p.height || +p.height > height
      )
      if (!list.length) return undefined
      const p = list.sort(
        (a, b) => +b.approved_percent - +a.approved_percent
      )[0]
      const percent = Math.min(100, Math.max(0, +p.approved_percent || 0))
      return {
        ...p,
        percent,
        approvals: Math.round((percent / 100) * this.activeNodes.length),
      }
    },
    upgradeMarker() {
      if (!this.activeNodes.length) return 0
      return (this.votesRequired * 100) / this.activeNodes.length
    },
    upgradeEta() {
      if (!this.upgrade?.height || !this.thorHeight) return undefined
      const rem = this.upgrade.height - this.thorHeight
      if (rem <= 0) return undefined
      return moment.duration(rem * 6, 'seconds').humanize()
    },
  },
  watch: {
    // Keep ?search= in the URL so the filter survives reloads and can be shared.
    searchQuery(term) {
      this.pageCount = 1
      this.syncSearchToUrl(term)
    },
    typeFilter() {
      this.pageCount = 1
    },
    sortBy() {
      this.pageCount = 1
    },
    // Back/forward or a link to /network/votes?search=... updates the box.
    '$route.query.search'(search) {
      const term = search || ''
      if (term !== this.searchQuery) {
        this.syncSearchToUrl.cancel()
        this.searchQuery = term
      }
    },
  },
  created() {
    // replace (not push) so each keystroke doesn't add a history entry.
    this.syncSearchToUrl = debounce((term) => {
      const query = { ...this.$route.query }
      const trimmed = term.trim()
      if (trimmed) {
        query.search = trimmed
      } else {
        delete query.search
      }
      if ((this.$route.query.search || '') === (query.search || '')) return
      this.$router.replace({ path: this.$route.path, query }).catch(() => {})
    }, 300)
  },
  beforeDestroy() {
    this.syncSearchToUrl.cancel()
  },
  async mounted() {
    try {
      await Promise.all([
        this.fetchVotes(),
        this.fetchNodes(),
        this.fetchMimirData(),
        this.fetchUpgradeProposals(),
      ])
      this.processVotes()
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      this.loading = false
    }
  },
  methods: {
    async fetchMimirData() {
      try {
        this.mimirData = (await this.$api.getMimir())?.data || {}
      } catch (error) {
        console.error('Error fetching Mimir data:', error)
      }
    },
    async fetchVotes() {
      try {
        this.votes = (await this.$api.getVotes())?.data || []
      } catch (error) {
        console.error('Error fetching votes:', error)
      }
    },
    async fetchUpgradeProposals() {
      try {
        this.upgradeProposals =
          (await this.$api.getUpgradeProposals())?.data || []
      } catch (error) {
        console.error('Error fetching upgrade proposals:', error)
      }
    },
    async fetchNodes() {
      try {
        const { data } = await this.$api.getNodes()
        const operators = {}
        for (const node of data) {
          operators[node.node_address] = node.node_operator_address
        }
        this.operators = operators
        this.activeNodes = data
          .filter((node) => node.status === 'Active')
          .map((node) => node.node_address)
        this.votesRequired = Math.floor((this.activeNodes.length * 2) / 3) + 1
      } catch (error) {
        console.error('Error fetching nodes:', error)
      }
    },
    processVotes() {
      const dayAgo = moment().subtract(24, 'hours')
      const twoDaysAgo = moment().subtract(48, 'hours')

      const votes = []
      for (let i = 0; i < this.votes.length; i++) {
        const vote = this.votes[i]
        if (!vote.votes?.length) continue

        const voteInfo = {
          value: vote.value,
          operational: isOperationalMimir(vote.value),
          keys: {},
          voters: [],
          latestVote: +vote.votes[0].date,
          earliestVote: +vote.votes[vote.votes.length - 1].date,
          mimirValue: this.mimirData[vote.value],
          notVoted: [...this.activeNodes],
        }

        // The API orders each node's votes newest-first, so the first entry
        // seen for an address is its latest vote and the rest are dropped.
        const counted = new Set()

        for (let j = 0; j < vote.votes.length; j++) {
          const { key, date, address } = vote.votes[j]
          const formattedDate = moment(date / 1e6)

          // notVoted starts as the full active set, so an address missing
          // from it is either inactive or already withdrawn from the tally.
          const delIndex = voteInfo.notVoted.indexOf(address)
          if (counted.has(address) || delIndex === -1) {
            continue
          }
          counted.add(address)

          const isRecent = formattedDate.isAfter(dayAgo)
          if (isRecent) {
            this.last24HVotes++
          } else if (formattedDate.isAfter(twoDaysAgo)) {
            this.prev24HVotes++
          }

          // A negative value cancels the node's vote rather than backing
          // that number: it joins no value bucket and stays in notVoted,
          // while `counted` keeps its older votes from counting either.
          const withdrawn = isVoteWithdrawal(key)
          voteInfo.voters.push({ address, key, date: +date, withdrawn })
          if (withdrawn) {
            continue
          }

          if (!voteInfo.keys[key]) {
            voteInfo.keys[key] = {
              addresses: [],
              votesInLast24h: 0,
            }
          }

          voteInfo.keys[key].addresses.push(address)
          voteInfo.notVoted.splice(delIndex, 1)

          if (isRecent) {
            voteInfo.keys[key].votesInLast24h += 1
          }
        }

        votes.push(this.summarize(voteInfo))
      }

      this.formattedVotes = votes.sort((a, b) => b.latestVote - a.latestVote)
    },
    // Derives the row summary: values ranked by support, the leader's
    // progress toward its threshold, and a status label.
    summarize(vote) {
      const required = this.getRequiredVotes(vote)
      const values = Object.entries(vote.keys)
        .map(([key, o]) => ({
          key,
          label: this.getVoteKeyLabel(vote.value, key),
          count: o.addresses.length,
          recent: o.votesInLast24h,
          passed: this.isVotePassed(o, key, vote),
        }))
        .sort((a, b) => b.count - a.count)
      const leading = values[0]
      const pct = (n) =>
        required ? (Math.min(n, required) * 100) / required : 0

      let status = 'none'
      if (leading) {
        if (leading.passed) status = 'effect'
        else if (values.length > 1) status = 'split'
        else status = 'gathering'
      }

      const progress = leading ? pct(leading.count) : 0
      const runnerUp =
        status === 'split' ? Math.min(pct(values[1].count), 100 - progress) : 0

      return {
        ...vote,
        required,
        values,
        leading,
        status,
        progress,
        runnerUpProgress: runnerUp,
        ratio: leading && required ? leading.count / required : 0,
        short: leading ? Math.max(0, required - leading.count) : required,
        votedCount: values.reduce((s, v) => s + v.count, 0),
        recent24h: values.reduce((s, v) => s + v.recent, 0),
      }
    },
    statusMeta(vote) {
      switch (vote.status) {
        case 'effect':
          return { label: 'In effect', cls: 'mv-pill--green' }
        case 'split':
          return { label: 'Split', cls: 'mv-pill--orange', pulse: true }
        case 'gathering':
          return { label: 'Gathering', cls: 'mv-pill--orange', pulse: true }
        default:
          return { label: 'Withdrawn', cls: 'mv-pill--grey' }
      }
    },
    barClass(vote) {
      if (vote.status === 'effect') return 'is-green'
      return vote.operational ? 'is-blue' : 'is-orange'
    },
    matchesSearch(address) {
      return !!this.query && address.toLowerCase().includes(this.query)
    },
    // Returns the first voter or operator address on a key that matches the
    // search, so a node search can open the rows it voted on.
    addressHit(vote) {
      if (!this.query) return undefined
      return vote.voters.find(
        (v) =>
          v.address.toLowerCase().includes(this.query) ||
          (this.operators[v.address] || '').toLowerCase().includes(this.query)
      )
    },
    isOpen(vote) {
      if (vote.value in this.openKeys) return this.openKeys[vote.value]
      return (
        !vote.value.toLowerCase().includes(this.query) &&
        this.addressHit(vote) !== undefined
      )
    },
    toggle(vote) {
      this.$set(this.openKeys, vote.value, !this.isOpen(vote))
    },
    toggleVoters(vote) {
      this.$set(this.allVoters, vote.value, !this.allVoters[vote.value])
    },
    toggleNotVoted(vote) {
      this.$set(this.allNotVoted, vote.value, !this.allNotVoted[vote.value])
    },
    voterMatches(voter) {
      return (
        this.matchesSearch(voter.address) ||
        this.matchesSearch(this.operators[voter.address] || '')
      )
    },
    shownVoters(vote) {
      let voters = vote.voters
      // Pin voters matching the search (node or operator) to the top.
      if (this.query) {
        const hits = voters.filter((v) => this.voterMatches(v))
        if (hits.length) {
          voters = [...hits, ...voters.filter((v) => !this.voterMatches(v))]
        }
      }
      if (this.allVoters[vote.value]) return voters
      return voters.slice(0, this.voterLimit)
    },
    shownNotVoted(vote) {
      if (this.allNotVoted[vote.value]) return vote.notVoted
      return vote.notVoted.slice(0, this.notVotedLimit)
    },
    setTypeFilter(id) {
      this.typeFilter = id
    },
    formatDate(date) {
      return moment(date).format('MMM D, HH:mm')
    },
    isVotePassed(o, key, vote) {
      if (vote.operational) {
        // Operational mimirs take effect immediately once quorum + strict
        // plurality is reached, so mimirData already holds the authoritative
        // current value. Our own vote tally is windowed (last 30 days) and
        // can disagree with it, so only the value matching mimirData counts
        // as active - recomputing quorum/plurality locally could otherwise
        // flag more than one value as active at the same time.
        return this.mimirData[vote.value] === +key
      }
      if (this.mimirData[vote.value] === +key) return true
      return o.addresses.length >= this.votesRequired
    },
    getVoteKeyLabel(voteValue, key) {
      // A negative value isn't a value a node backs - it removes the node's
      // vote on the key, so it never reads as "the node voted -1".
      if (isVoteWithdrawal(key)) {
        return `Withdrawn (${key})`
      }
      if (voteValue === 'SOL-RPC-PROVIDER') {
        const providerMap = {
          1: '(1) Self Hosted',
          2: '(2) Liquify',
          3: '(3) QuickNode',
          4: '(4) Alchemy',
          5: '(5) Chainstack',
          6: '(6) Ankr',
          7: '(7) Blockdaemon',
          8: '(8) Helius',
        }
        return providerMap[key] || key
      }
      return key
    },
    getRequiredVotes(vote) {
      return requiredVotes({
        key: vote.value,
        activeNodeCount: this.activeNodes.length,
        operationalVotesMin: this.operationalVotesMin,
      })
    },
  },
}
</script>

<style scoped lang="scss">
$orange: #e0a942;
$blue: #7ba4ff;

.mv {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin: 0 $space-10;
  color: var(--font-color);

  @include lg {
    margin: 0;
  }
}

.mono {
  font-family: 'Roboto Mono', ui-monospace, monospace;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
.mv-strong {
  color: var(--sec-font-color);
  font-weight: 500;
}
.mv-dim {
  color: var(--font-color);
  font-size: 12.5px;
}
.mv-muted {
  color: var(--font-color);
  font-size: 11.5px;
  opacity: 0.85;
}
.mv-faint {
  color: var(--font-color);
  opacity: 0.6;
}
.mv-small {
  font-size: 12px;
}
.mv-label {
  font-size: 10px;
  line-height: 1;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--font-color);
}
.is-green-text {
  color: var(--green);
}
.is-orange-text {
  color: $orange;
}
.is-blue-text {
  color: $blue;
}

.mv-dot {
  width: 6px;
  height: 6px;
  border-radius: 2px;
  flex: none;

  &.is-orange {
    background: $orange;
  }
  &.is-blue {
    background: $blue;
  }
}

@keyframes mvPulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

/* Header */
.mv-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.mv-sub {
  margin: 0;
  font-size: 13px;
  color: var(--font-color);
}
.mv-live {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--card-bg-color);
  border: 1px solid var(--border-color);
  font-size: 12px;
  font-weight: 500;

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--primary-color);
    animation: mvPulse 1.6s infinite;
  }
}

/* Stat cards */
.mv-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @include lg {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
.mv-stat {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 15px 16px;
  background: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: $radius-lg;

  &__value {
    font-size: 26px;
    line-height: 1;
    font-weight: 700;
    color: var(--sec-font-color);
  }
  &__of {
    font-size: 16px;
    opacity: 0.5;
  }
  &__sub {
    font-size: 11.5px;
    color: var(--font-color);

    &.is-up {
      color: var(--green);
    }
    &.is-down {
      color: $orange;
    }
  }
}

/* Upgrade banner */
.mv-upgrade {
  background: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: $radius-lg;
  overflow: hidden;

  &.is-ok {
    border-color: rgba(44, 190, 140, 0.35);
  }
  &__top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px 16px;
    flex-wrap: wrap;
    padding: 14px 18px;
    border-bottom: 1px solid var(--border-color);
  }
  &__title {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  &__name {
    font-size: 16px;
    font-weight: 700;
    color: var(--sec-font-color);
  }
  &__body {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px 18px;
  }
  &__row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  &__count {
    font-size: 13px;
    font-weight: 600;
    color: var(--sec-font-color);

    &.is-ok {
      color: var(--green);
    }
  }
}
.mv-tag {
  display: inline-flex;
  padding: 3px 8px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  &--blue {
    background: rgba(84, 140, 255, 0.14);
    color: $blue;
  }
}

/* Pills */
.mv-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;

  &--green {
    background: rgba(33, 193, 135, 0.13);
    color: var(--green);
  }
  &--orange {
    background: rgba(224, 169, 66, 0.13);
    color: $orange;
  }
  &--grey {
    background: var(--active-bg-color);
    color: var(--font-color);
  }
  &__dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
    animation: mvPulse 1.6s infinite;
  }
}

/* Progress bars */
.mv-bar {
  position: relative;
  display: flex;
  height: 7px;
  border-radius: 99px;
  background: var(--active-bg-color);
  overflow: hidden;

  &--lg {
    height: 8px;
    overflow: visible;
  }
  &__fill {
    height: 100%;
    border-radius: 99px;

    &.is-green {
      background: var(--green);
    }
    &.is-orange {
      background: $orange;
    }
    &.is-blue {
      background: $blue;
    }
    &.is-grey {
      background: var(--font-color);
      opacity: 0.45;
    }
  }
  &__gap {
    width: 2px;
    flex: none;
  }
  &__marker {
    position: absolute;
    top: -3px;
    width: 2px;
    height: 14px;
    border-radius: 1px;
    background: var(--sec-font-color);
  }
}

/* Toolbar */
.mv-toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.mv-chips {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
}
.mv-chip,
.mv-search,
.mv-sort {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 38px;
  padding: 0 13px;
  border-radius: $radius-md;
  background: var(--card-bg-color);
  border: 1px solid var(--border-color);
  font-size: 12.5px;
  font-weight: 500;
  color: var(--font-color);
}
.mv-chip {
  cursor: pointer;
  font-family: inherit;

  &:hover {
    color: var(--sec-font-color);
  }
  &.is-on {
    color: var(--sec-font-color);
    background: var(--active-bg-color);
    border-color: var(--primary-color);
  }
}
.mv-search {
  flex: 1;
  min-width: 220px;

  &:focus-within {
    border-color: var(--primary-color);
  }
  &__icon {
    width: 16px;
    height: 16px;
    flex: none;
    fill: var(--font-color);
  }
  input {
    flex: 1;
    min-width: 0;
    height: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--sec-font-color);
    font: inherit;
  }
}
.mv-sort {
  select {
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--sec-font-color);
    font: inherit;
    cursor: pointer;

    option {
      background: var(--card-bg-color);
    }
  }
}

/* Table */
.mv-table {
  background: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: $radius-lg;
  overflow: hidden;
}
.mv-grid {
  display: grid;
  gap: 10px 16px;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    'key caret'
    'leading status'
    'bar bar'
    'last last';
  padding: 14px 16px;

  @include lg {
    grid-template-columns:
      minmax(220px, 1fr) minmax(120px, 168px) minmax(160px, 200px)
      132px 128px 24px;
    grid-template-areas: 'key leading bar status last caret';
    align-items: center;
    padding: 15px 18px;
  }

  &--head {
    display: none;
    padding: 11px 18px;
    border-bottom: 1px solid var(--border-color);
    background: var(--bg-color);

    @include lg {
      display: grid;
      grid-template-areas: none;
    }
  }
}
.mv-row {
  width: 100%;
  text-align: left;
  border: 0;
  border-bottom: 1px solid var(--border-color);
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;

  &:hover,
  &.is-open {
    background: var(--bg-color);
  }
  &:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: -2px;
  }
}
.mv-cell {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;

  &--key {
    grid-area: key;
  }
  &--leading {
    grid-area: leading;
  }
  &--bar {
    grid-area: bar;
    gap: 6px;
  }
  &--status {
    grid-area: status;
    align-items: flex-end;

    @include lg {
      align-items: flex-start;
    }
  }
  &--last {
    grid-area: last;
    gap: 3px;
    flex-direction: row;
    align-items: baseline;

    @include lg {
      flex-direction: column;
    }
  }
}
.mv-key {
  font-size: 14px;
  font-weight: 600;
  color: var(--sec-font-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mv-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.mv-current {
  font-weight: 700;
  color: var(--primary-color);
}
.mv-type {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 500;
}
.mv-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--sec-font-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mv-caret {
  grid-area: caret;
  justify-self: end;
  font-size: 15px;
  color: var(--font-color);
}
.mv-empty {
  padding: 28px 18px;
  text-align: center;
  font-size: 13px;
}
.mv-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 13px 18px;
  background: var(--bg-color);
}
.mv-btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 7px;
  background: var(--card-bg-color);
  border: 1px solid var(--border-color);
  color: var(--sec-font-color);
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    border-color: var(--primary-color);
  }
}

/* Expanded row */
.mv-detail {
  display: grid;
  gap: 14px;
  padding: 16px;
  background: var(--bg-color);
  border-bottom: 1px solid var(--border-color);

  @include lg {
    grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
    padding: 18px;
    align-items: start;
  }
}
.mv-panel {
  background: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: $radius-lg;
  overflow: hidden;

  &--pad {
    padding: 13px 14px;
  }
  &__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 11px 14px;
    border-bottom: 1px solid var(--border-color);

    &--flat {
      padding: 0 0 11px;
      border: 0;
    }
  }
}
.mv-side {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
.mv-values {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-color);
}
.mv-value-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 9px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  font-size: 11.5px;

  &.is-on {
    border-color: rgba(33, 193, 135, 0.5);
  }
}
.mv-vgrid {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) minmax(0, 1fr) 96px;
  gap: 12px;
  align-items: center;
  padding: 9px 14px;
  border-bottom: 1px solid var(--border-color);
  font-size: 12.5px;

  > * {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &--head {
    font-size: 9.5px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  &.is-hit {
    background: rgba(44, 190, 140, 0.08);
  }
}
.mv-link {
  color: var(--font-color);

  &.mv-strong {
    color: var(--sec-font-color);
  }
  &:hover {
    color: var(--primary-color);
  }
}
.mv-more {
  display: block;
  width: 100%;
  padding: 11px 14px;
  border: 0;
  background: transparent;
  text-align: left;
  color: var(--primary-color);
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}
.mv-nodes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.mv-node {
  padding: 4px 9px;
  border-radius: 6px;
  background: var(--active-bg-color);
  border: 1px solid var(--border-color);
  font-family: 'Roboto Mono', ui-monospace, monospace;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--font-color);

  &:hover {
    color: var(--sec-font-color);
  }
  &.is-hit {
    border-color: var(--primary-color);
    color: var(--sec-font-color);
  }
  &--more {
    background: transparent;
    border-style: dashed;
    font-family: inherit;
    cursor: pointer;
  }
}
.mv-note {
  margin: 10px 0 0;
  line-height: 1.5;
}
.mv-timing {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__row {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    padding-top: 10px;
    border-top: 1px solid var(--border-color);
  }
  &__item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}
.mv-text {
  line-height: 1.6;
}
</style>
