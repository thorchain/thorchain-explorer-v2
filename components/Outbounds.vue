<template>
  <Card
    :navs="[
      { title: 'Ongoing Outbounds', value: 'ongoing-outbounds' },
      { title: 'TOP Swaps (24hr)', value: 'top-swaps' },
    ]"
    :act-nav.sync="Mode"
  >
    <template #header>
      <dot-live />
    </template>
    <template v-if="Mode == 'ongoing-outbounds'">
      <template v-if="!noOutnound">
        <template v-if="!loading">
          <Card class="overview-card">
            <div class="overview-box">
              <div :class="'mini-bubble info'">
                <span>Scheduled</span>
              </div>
              <div class="stats-container">
                <div>
                  <span class="item-value">Amount: </span>
                  <span
                    class="outbound-overall mono"
                    style="padding-right: 0.8rem"
                  >
                    ${{ totalScheduledValue | number('0a') }}
                  </span>
                </div>
                <div>
                  <span class="item-value">Count: </span>
                  <span class="outbound-overall mono">{{
                    schData.length
                  }}</span>
                </div>
              </div>
            </div>
          </Card>
          <ArrowToDown class="arrow-down-icon" />
          <Card class="overview-card">
            <div class="overview-box">
              <div :class="'mini-bubble'">
                <span>Ongoing</span>
              </div>
              <div class="stats-container">
                <div>
                  <span class="item-value">Amount: </span>
                  <span
                    class="outbound-overall mono"
                    style="padding-right: 0.8rem"
                  >
                    ${{ totalOutboundValue | number('0a') }}</span
                  >
                </div>
                <div>
                  <span class="item-value">Count: </span>
                  <span class="outbound-overall mono">
                    {{ outData.length }}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </template>
        <template v-else>
          <Card class="overview-card">
            <div class="overview-box">
              <skeleton-loader width="80px" />
              <div style="display: flex">
                <div>
                  <skeleton-loader width="40px" height="10px" />
                </div>
                <div>
                  <skeleton-loader width="30px" height="10px" />
                </div>
              </div>
            </div>
          </Card>
          <ArrowToDown class="arrow-down-icon" />
          <Card class="overview-card">
            <div class="overview-box">
              <skeleton-loader width="70px" />
              <div style="display: flex">
                <div>
                  <skeleton-loader width="40px" height="10px" />
                </div>
                <div>
                  <skeleton-loader width="30px" height="10px" />
                </div>
              </div>
            </div>
          </Card>
        </template>
      </template>
      <div v-if="noOutnound" class="no-outbound">
        <scheduleIcon class="schedule-icon large-icon" />
        <h3>There is no outbound schedule inside THORChain.</h3>
      </div>
      <template v-else-if="!loading && filteredOutbounds.length > 0">
        <div
          v-for="(group, i) in filteredOutbounds"
          :key="i"
          class="outbound-item"
          @click="toggleExtraRight(i)"
        >
          <div class="outbound-collapse">
            <div class="asset-item">
              <div class="asset-details">
                <asset-icon :asset="group.asset" />
                <span class="asset-name">
                  <span class="asset-amount mono">
                    {{ (group.totalAmount / 1e8) | number('0,0.0000') }}
                  </span>
                  <small class="asset-text sec-color">
                    {{ showAsset(group.asset) }}
                  </small>
                  <span v-if="group.totalAmountUSD > 0" class="asset-total-usd">
                    - ${{ group.totalAmountUSD | number('0,0.0a') }}
                  </span>
                </span>
              </div>

              <div class="number-item">
                <span v-if="group.vaults.length > 0" class="vault-dots">
                  <color-hash
                    v-for="v in group.vaults"
                    :key="v.pubKey"
                    v-tooltip="vaultTooltip(v)"
                    :name="v.pubKey"
                  />
                </span>
                <span
                  v-if="group.ongoingCount > 0"
                  :class="'mini-bubble'"
                  style="width: 1.3rem; height: 1.3rem; font-size: 12px"
                >
                  {{ group.ongoingCount }}
                </span>
                <span
                  v-if="group.scheduledCount > 0"
                  :class="'mini-bubble info'"
                  style="width: 1.3rem; height: 1.3rem; font-size: 12px"
                >
                  {{ group.scheduledCount }}
                </span>
                <span
                  v-if="group.stuckCount > 0"
                  v-tooltip="'Past due more than 300 blocks'"
                  :class="'mini-bubble danger'"
                  style="width: 1.3rem; height: 1.3rem; font-size: 12px"
                >
                  {{ group.stuckCount }}
                </span>
                <angle-icon
                  :class="{ trigger: true, rotated: angleRotated[i] }"
                />
              </div>
            </div>

            <div v-if="group.stuckCount > 0" class="stuck-info-bar">
              <span class="stuck-info-text">
                {{ group.stuckCount }}
                {{ group.stuckCount === 1 ? 'outbound' : 'outbounds' }}
                past due &mdash; oldest
                <strong>~{{ pastDueTime(group.maxBlocksPastDue) }}</strong>
                ({{ group.maxBlocksPastDue | number('0,0') }} blocks)
              </span>
            </div>

            <div v-if="isVisible[i]" class="extra-right">
              <div
                v-for="(o, idx) in group.items"
                :key="idx"
                class="asset-info"
              >
                <div class="left-part">
                  <VDropdown
                    v-if="o.vault_pub_key"
                    theme="dropdown"
                    placement="bottom-start"
                    class="vault-dropdown"
                    popper-class="vault-popper"
                    :distance="8"
                    :triggers="['hover', 'click']"
                    :hide-triggers="['hover']"
                    :popper-triggers="['hover']"
                    :delay="{ show: 60, hide: 250 }"
                    @click.native.stop
                  >
                    <span class="vault-dot-hit">
                      <color-hash :name="o.vault_pub_key" />
                    </span>
                    <template #popper>
                      <div class="tooltip-header">
                        <color-hash :name="o.vault_pub_key" />
                        <span>Asgard Vault</span>
                        <span
                          v-if="vaultStatusFor(o.vault_pub_key)"
                          :class="[
                            'mini-bubble',
                            {
                              yellow:
                                vaultStatusFor(o.vault_pub_key) === 'Retiring',
                            },
                          ]"
                        >
                          {{ vaultStatusFor(o.vault_pub_key) }}
                        </span>
                      </div>
                      <div class="tooltip-body vault-popover">
                        <div class="vault-row">
                          <span class="vault-label">Vault Pub Key</span>
                          <span class="vault-value mono">
                            {{ o.vault_pub_key }}
                            <copy
                              :str-copy="o.vault_pub_key"
                              size="small"
                              :hide-toast="true"
                            />
                          </span>
                        </div>
                        <div
                          v-if="vaultAddressFor(o.vault_pub_key, o.chain)"
                          class="vault-row"
                        >
                          <span class="vault-label">
                            {{ o.chain }} Vault Address
                          </span>
                          <span class="vault-value mono">
                            <NuxtLink
                              class="clickable"
                              :to="{
                                path: `/address/${vaultAddressFor(
                                  o.vault_pub_key,
                                  o.chain
                                )}`,
                              }"
                            >
                              {{ vaultAddressFor(o.vault_pub_key, o.chain) }}
                            </NuxtLink>
                            <copy
                              :str-copy="
                                vaultAddressFor(o.vault_pub_key, o.chain)
                              "
                              size="small"
                              :hide-toast="true"
                            />
                          </span>
                        </div>
                        <span v-else class="vault-missing">
                          Vault details unavailable
                        </span>
                      </div>
                    </template>
                  </VDropdown>
                  <span class="asset-name">
                    {{
                      $options.filters.number(o.coin.amount / 1e8, '0,0.0000')
                    }}
                    <template
                      v-if="
                        pools &&
                        !isNaN(getAssetAmountUSD(o.coin.asset, o.coin.amount))
                      "
                    >
                      -
                      <small>
                        ${{
                          getAssetAmountUSD(o.coin.asset, o.coin.amount)
                            | number('0,0.0a')
                        }}
                      </small>
                    </template>
                  </span>
                  <div
                    v-if="o.label === 'Scheduled'"
                    :class="'mini-bubble info'"
                  >
                    Scheduled
                  </div>
                  <small v-if="o.to_address" class="mono outbound-destination">
                    &rarr;
                    <Address
                      :address="o.to_address"
                      :show-copy-icon="false"
                    ></Address>
                  </small>
                </div>
                <div class="right-part">
                  <div
                    v-if="o.height || o.blocksSinceScheduled != null"
                    class="outbound-timing"
                  >
                    <template v-if="blocksPastDue(o) > 0">
                      <span
                        :class="[
                          'outbound-pastdue',
                          { 'outbound-stuck-text': isStuck(o) },
                        ]"
                      >
                        ~{{ pastDueTime(blocksPastDue(o)) }} past due
                      </span>
                      <span class="outbound-timing-sub mono">
                        {{ blocksPastDue(o) | number('0,0') }} blocks
                      </span>
                    </template>
                    <span
                      v-else-if="getOutboundEta(o.height)"
                      class="outbound-eta"
                    >
                      ~{{ getOutboundEta(o.height) }}
                    </span>
                    <span
                      v-if="
                        o.scheduledOutboundHeight &&
                        o.scheduledOutboundHeight !== o.height
                      "
                      v-tooltip="'Original schedule → latest queue attempt'"
                      class="outbound-timing-sub mono"
                    >
                      #{{ o.scheduledOutboundHeight | number('0,0') }} &rarr;
                      #{{ o.height | number('0,0') }}
                    </span>
                    <span v-else class="outbound-timing-sub mono">
                      Sched. #{{ o.height | number('0,0') }}
                    </span>
                  </div>
                  <small v-if="o.in_hash && o.label !== 'migrate'" class="mono">
                    <NuxtLink
                      class="clickable"
                      :to="{ path: `/tx/${o.in_hash}` }"
                    >
                      {{ formatAddress(o.in_hash) }}
                    </NuxtLink>
                  </small>
                </div>
              </div>
            </div>
          </div>
          <hr :key="i + '-hr'" class="hr-space" />
        </div>
      </template>
      <template v-else>
        <div v-for="index in 5" :key="index" class="outbound-item">
          <div class="outbound-collapse">
            <div class="asset-item">
              <div class="asset-details">
                <skeleton-loader width="24px" height="24px" />
                <div class="asset-name-skeleton">
                  <skeleton-loader width="120px" />
                  <skeleton-loader width="80px" />
                </div>
              </div>
              <div class="number-item">
                <skeleton-loader width="16px" height="16px" />
              </div>
            </div>
          </div>
          <hr :key="index + '-hr'" class="hr-space" />
        </div>
      </template>
    </template>
    <template v-if="Mode == 'top-swaps'">
      <div v-if="!topSwaps || topSwaps.length == 0" class="no-outbound">
        <h3>There is been no swaps in the last 24hr.</h3>
      </div>
      <ActionRow v-for="(swap, index) in topSwaps" :key="index" :row="swap" />
      <nuxt-link to="/swaps" class="swaps-nav">More</nuxt-link>
    </template>

    <template
      v-if="Mode == 'ongoing-outbounds' && groupedOutbounds.length > 10"
      #footer
    >
      <b-pagination
        v-model="currentPage"
        class="center"
        :total-rows="groupedOutbounds.length"
        :per-page="10"
      />
    </template>
  </Card>
</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'
import Address from '~/components/transactions/Address.vue'
import scheduleIcon from '@/assets/images/schedule.svg?inline'
import ArrowToDown from '~/assets/images/arrow-down.svg?inline'
import ActionRow from '~/components/transactions/ActionRow.vue'
import AngleIcon from '~/assets/images/angle-down.svg?inline'
import SkeletonLoader from '~/components/SkeletonLoader.vue'

export default {
  components: {
    scheduleIcon,
    ArrowToDown,
    ActionRow,
    AngleIcon,
    Address,
    SkeletonLoader,
  },
  data() {
    return {
      isVisible: [],
      currentPage: 1,
      noOutnound: false,
      loading: true,
      outbounds: [],
      intervalId: undefined,
      outData: [],
      schData: [],
      Mode: 'ongoing-outbounds',
      topSwaps: [],
      angleRotated: [],
      vaults: {},
      vaultsFetchedAt: 0,
    }
  },
  computed: {
    filteredOutbounds() {
      return this.groupedOutbounds.slice(
        (this.currentPage - 1) * 10,
        this.currentPage * 10
      )
    },
    totalOutboundValue() {
      return this.outData.reduce((total, o) => {
        return (
          total +
          (this.amountToUSD(o.coin.asset, o.coin.amount, this.pools) || 0)
        )
      }, 0)
    },
    totalScheduledValue() {
      return this.schData.reduce((total, o) => {
        return total + this.amountToUSD(o.coin.asset, o.coin.amount, this.pools)
      }, 0)
    },
    groupedOutbounds() {
      const grouped = this.outbounds.reduce((acc, o) => {
        const key = o.coin.asset
        if (!acc[key]) {
          acc[key] = {
            asset: key,
            totalAmount: 0,
            totalAmountUSD: 0,
            count: 0,
            scheduledCount: 0,
            ongoingCount: 0,
            stuckCount: 0,
            maxBlocksPastDue: 0,
            label: o.label,
            vaultMap: {},
            items: [],
          }
        }

        const amount = o.coin.amount ? parseFloat(o.coin.amount) : 0
        const amountUSD =
          this.amountToUSD(o.coin.asset, amount, this.pools) || 0
        acc[key].totalAmount += amount
        acc[key].totalAmountUSD += amountUSD
        acc[key].count += 1

        if (o.vault_pub_key) {
          const vault = acc[key].vaultMap[o.vault_pub_key]
          if (vault) {
            vault.count += 1
          } else {
            acc[key].vaultMap[o.vault_pub_key] = {
              pubKey: o.vault_pub_key,
              count: 1,
            }
          }
        }

        if (o.label === 'Scheduled') {
          acc[key].scheduledCount += 1
        }

        if (o.label === 'Ongoing') {
          acc[key].ongoingCount += 1
        }

        if (this.isStuck(o)) {
          acc[key].stuckCount += 1
          const pastDue = this.blocksPastDue(o)
          if (pastDue > (acc[key].maxBlocksPastDue || 0)) {
            acc[key].maxBlocksPastDue = pastDue
          }
        }

        acc[key].items.push(o)
        return acc
      }, {})

      return Object.values(grouped).map((g) => ({
        ...g,
        vaults: Object.values(g.vaultMap),
      }))
    },
    ...mapGetters({
      chainsHeight: 'getChainsHeight',
      pools: 'getPools',
      runePrice: 'getRunePrice',
    }),
  },
  mounted() {
    this.updateVaults()
    this.updateOutbounds()
    this.updateTopSwaps()
    // Update the component every 20 secs
    this.intervalId = setInterval(() => {
      this.updateOutbounds()
      this.updateTopSwaps()
    }, 20000)
  },
  destroyed() {
    this.clearIntervalId(this.intervalId)
  },
  methods: {
    async updateTopSwaps() {
      try {
        const response = await this.$api.getTopSwaps()
        const resData = response.data
        if (
          resData &&
          typeof resData === 'object' &&
          Array.isArray(resData.actions)
        ) {
          this.topSwaps = resData.actions.slice(0, 10).map((swap) => {
            let outputAsset = swap.out[0]
            if (swap.in.length > 0) {
              outputAsset = swap.out.find((s) => s.affiliate !== true)
            }

            return {
              type: swap.type,
              in: swap.in,
              out: swap.out,
              metadata: swap.metadata,
              // Left raw (nanoseconds) — ActionRow does its own formatting.
              date: swap.date,
              height: swap.height,
              txID: swap.in[0]?.txID,
              inputAsset: {
                address: swap.in[0]?.address,
                asset: swap.in[0]?.coins[0]?.asset,
                amount: swap.in[0]?.coins[0]?.amount,
              },
              outputAsset: {
                address: outputAsset?.address,
                asset: outputAsset?.coins[0]?.asset,
                amount: outputAsset?.coins[0]?.amount,
              },
            }
          })
        } else {
          console.error(
            'API response does not contain an actions array:',
            this.swaps.outputAsset
          )
          this.topSwaps = []
        }
      } catch (error) {
        console.error('Error fetching top swaps:', error)
      } finally {
        this.loading = false
      }
    },
    async fetchOutboundQueue() {
      // Middleware endpoint returns queue items enriched with
      // blocks_since_scheduled (queue `height` resets on every reschedule,
      // so it underestimates how long an outbound has been waiting).
      try {
        const { data } = await this.$api.getOutboundsDetail()
        return (data ?? []).map((o) => ({
          ...o,
          blocksSinceScheduled: o.blocks_since_scheduled ?? undefined,
          scheduledOutboundHeight: o.scheduled_outbound_height ?? undefined,
        }))
      } catch (error) {
        // Endpoint not deployed yet: fall back to the raw thornode queue
        return (await this.$api.getOutbound()).data ?? []
      }
    },
    async updateOutbounds() {
      this.noOutnound = false
      const resData = []
      this.outData = await this.fetchOutboundQueue()
      this.schData = (await this.$api.getScheduled()).data ?? []
      resData.push(
        ...this.outData.map((s) => ({
          ...s,
          label: 'Ongoing',
          ...(s.memo.toUpperCase().includes('MIGRATE') && { label: 'migrate' }),
        })),
        ...this.schData.map((s) => ({ ...s, label: 'Scheduled' }))
      )
      if (!resData || resData?.length === 0) {
        this.outbounds = []
        this.noOutnound = true
        this.loading = false
        return
      }
      this.outbounds = resData
      this.loading = false
      this.ensureVaults()
    },
    async updateVaults() {
      this.vaultsFetchedAt = Date.now()
      try {
        const { data } = await this.$api.getAsgard()
        this.vaults = (data ?? []).reduce((acc, v) => {
          if (v?.pub_key) acc[v.pub_key] = v
          return acc
        }, {})
      } catch (error) {
        console.error('Error fetching asgard vaults:', error)
      }
    },
    // Vaults only change on churn, so refetch lazily when an outbound
    // references a pub key we haven't seen yet (throttled to 1 min).
    ensureVaults() {
      const unknown = this.outbounds.some(
        (o) => o.vault_pub_key && !this.vaults[o.vault_pub_key]
      )
      if (unknown && Date.now() - this.vaultsFetchedAt > 60000) {
        this.updateVaults()
      }
    },
    vaultFor(pubKey) {
      return pubKey ? this.vaults[pubKey] : undefined
    },
    vaultAddressFor(pubKey, chain) {
      if (!chain) return undefined
      return this.vaultFor(pubKey)?.addresses?.find((a) => a.chain === chain)
        ?.address
    },
    vaultStatusFor(pubKey) {
      const status = this.vaultFor(pubKey)?.status
      if (status === 'ActiveVault') return 'Active'
      if (status === 'RetiringVault') return 'Retiring'
      return status
    },
    vaultTooltip(vault) {
      const status = this.vaultStatusFor(vault.pubKey)
      return (
        `${vault.count} outbound${vault.count === 1 ? '' : 's'} from vault ` +
        `${this.addressFormatV2(vault.pubKey)}${status ? ` (${status})` : ''}`
      )
    },
    blocksPastDue(o) {
      // Prefer blocks_since_scheduled from tx status (reflects original schedule,
      // not the most recent reschedule height stored in the queue).
      if (o?.blocksSinceScheduled != null) return o.blocksSinceScheduled
      const height = typeof o === 'number' ? o : o?.height
      if (!height || !this.chainsHeight?.THOR) return 0
      return Math.max(0, this.chainsHeight.THOR - height)
    },
    isStuck(o) {
      return this.blocksPastDue(o) > 300
    },
    pastDueTime(blocks) {
      if (!blocks) return ''
      return moment.duration(blocks * 6, 'seconds').humanize()
    },
    getOutboundEta(height) {
      if (!this.chainsHeight?.THOR || !height) return undefined
      const remHeight = height - this.chainsHeight.THOR
      if (remHeight <= 0) return undefined
      return moment.duration(remHeight * 6, 'seconds').humanize()
    },
    toggleExtraRight(index) {
      this.$set(this.isVisible, index, !this.isVisible[index])
      this.$set(this.angleRotated, index, !this.angleRotated[index])
    },
    getAssetAmountUSD(asset, amount) {
      if (!this.pools) {
        return undefined
      }
      return this.amountToUSD(asset, amount, this.pools)
    },
  },
}
</script>

<style lang="scss" scoped>
.asset-item-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: $space-5;
  margin-bottom: $space-8;
  justify-content: space-between;

  span {
    font-size: $font-size-mobile;
  }
}
.asset-details {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: $space-5;
  flex: 1 1 auto;
  min-width: 0;

  > :first-child {
    flex-shrink: 0;
  }
}
.asset-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: $space-0 $space-8;
  cursor: pointer;

  .number-item {
    display: flex;
    align-items: center;
    gap: $space-5;
    flex-shrink: 0;
  }
  .rotated {
    transform: rotate(180deg);
  }
}

.asset-name-swaps {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  @include sm {
    flex-direction: row;
  }
}

.arrow-down-icon {
  width: auto;
  margin-left: auto;
  display: flex;
  justify-content: center;
  position: relative;
  right: calc(50% - 17.5px);
  height: 2rem;
  bottom: 0.2rem;
}
.overview-card {
  background-color: var(--bg-color);
  border-radius: $radius-lg;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  color: var(--font-color);
  border: 1px solid var(--border-color) !important;

  &:first-of-type {
    margin-bottom: -10px;
  }

  &:nth-of-type(2) {
    margin-top: $space-3;
    margin-bottom: $space-16;
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }
}

.overview-box {
  display: flex;
  justify-content: space-between;
  text-align: center;
  align-items: center;

  .mini-bubble {
    max-height: 20px;
  }
}

.title {
  font-weight: 600;
  color: var(--font-color);
  animation: fadeIn 0.5s ease;
}

.stats-container {
  display: flex;
  flex-direction: column;
  align-items: center;

  @include md {
    flex-direction: row;
    justify-content: space-between;
    gap: 1rem;

    div {
      display: flex;
      justify-content: center;
      gap: 1rem;

      &:first-child {
        flex: 2;
        border-bottom: none !important;
        border-right: 1px solid var(--primary-color);
      }
    }
  }

  div {
    flex: 1;
    padding: $space-5;
    margin: $space-0;
    animation: slideIn 0.5s ease;

    @include md {
      padding: $space-0;
    }

    &:first-child {
      border-bottom: 1px solid var(--primary-color);
    }
  }
}

.outbound-overall {
  color: var(--sec-font-color);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateX(-20px);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.no-outbound {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: $space-32;

  .schedule-icon {
    stroke: var(--font-color);
    height: 100px;
  }

  h3 {
    text-align: center;
  }
}
.swaps-nav {
  margin-top: $space-8;
}
.outbound-collapse {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}
.outbound-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-12 $space-0;
  border-bottom: 1px solid var(--border-color) !important;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  &:last-child {
    border-bottom: none !important;
  }

  margin-top: $space-8;
  &:hover {
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
  }

  .trigger {
    width: 1rem;
    height: 1rem;
    fill: var(--font-color);
    cursor: pointer;
    transition: transform 0.3s ease;
  }

  .stuck-info-bar {
    display: flex;
    align-items: center;
    gap: $space-8;
    margin: 0 $space-6;
    padding: $space-5 $space-8;
    border-radius: $radius-sm;
    background-color: rgba(240, 72, 50, 0.06);
    border: 1px solid rgba(240, 72, 50, 0.2);

    .stuck-info-text {
      font-size: 11px;
      color: var(--sec-font-color);
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;

      strong {
        color: #f04832;
      }
    }
  }

  .asset-item {
    display: flex;
    align-items: center;
    gap: 5px;
    justify-content: space-between;

    .asset-text {
      display: inline-block;
      overflow-wrap: anywhere;
      min-width: 0;
    }

    .asset-name {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 5px;
      color: var(--sec-font-color);
      min-width: 0;
    }

    .asset-amount {
      white-space: nowrap;
    }

    .asset-total-usd {
      white-space: nowrap;
    }
  }
  .extra-right {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .right-part {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 7px;
      width: 100%;

      @include md {
        justify-content: end;
        flex-wrap: nowrap;
      }
    }

    .asset-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      width: 100%;
      gap: $space-8;
      padding: $space-8;
      &:last-child {
        border-bottom: none;
      }

      @include md {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
      }
    }
    .left-part {
      display: flex;
      flex-direction: row;
      align-items: center;
      width: 100%;
      gap: $space-8;
      flex-wrap: wrap;
    }

    small {
      text-wrap: nowrap;
      text-overflow: ellipsis;
    }

    span {
      font-size: $font-size-mobile;
      display: flex;
      align-items: center;
      gap: 3px;
    }

    .outbound-timing {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;

      @include md {
        align-items: flex-end;
      }
    }

    .outbound-pastdue {
      font-size: 11px;
      font-weight: 600;
      color: var(--sec-font-color);
    }

    .outbound-stuck-text {
      color: #f04832;
    }

    .outbound-eta {
      font-size: 10px;
      color: var(--sec-font-color);
    }

    .outbound-timing-sub {
      font-size: 10px;
      color: var(--sec-font-color);
      opacity: 0.6;
    }

    .outbound-destination {
      color: var(--sec-font-color);
      opacity: 0.7;
    }
  }
}

.vault-dots {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-right: $space-3;
}

.vault-dropdown {
  display: flex;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;

  // Enlarge the touch target around the 10px dot without shifting the row.
  .vault-dot-hit {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $space-8;
    margin: -$space-8;
    -webkit-tap-highlight-color: transparent;
  }
}

.vault-popover {
  min-width: 200px;

  .vault-row {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .vault-label {
    font-size: 10px;
    color: var(--sec-font-color);
    opacity: 0.7;
  }

  .vault-value {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--font-color);
    word-break: break-all;

    a {
      word-break: break-all;
    }
  }

  .vault-missing {
    font-size: 11px;
    color: var(--sec-font-color);
    opacity: 0.7;
  }
}
</style>
