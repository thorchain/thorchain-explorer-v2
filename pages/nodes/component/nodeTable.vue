<template>
  <div>
    <vue-good-table
      v-if="rows"
      :key="1"
      :columns="cols"
      :rows="rows"
      style-class="vgt-table net-table bordered condensed node-table"
      :line-numbers="true"
      :row-style-class="rowClassCallback"
      :search-options="{
        enabled: true,
        externalQuery: searchTerm,
      }"
      :sort-options="{
        enabled: true,
        initialSortBy: sortColumn
          ? [{ field: sortColumn, type: sortOrder }]
          : [],
      }"
      @on-sort-change="handleSortChange"
    >
      <template slot="table-column" slot-scope="props">
        <div v-if="props.column.field.includes('behind')" class="table-asset">
          <img
            class="asset-chain"
            :src="assetImage(`${props.column.label}.${props.column.label}`)"
          />
        </div>
        <span v-else-if="props.column.field == 'highlight'">
          <HighlightList class="table-icon"></HighlightList>
        </span>
        <div
          v-else-if="props.column.field == 'location'"
          v-tooltip="'Node Location'"
        >
          <MarkerIcon class="table-icon" />
        </div>
        <div v-else-if="props.column.field == 'churn'">
          <recycle-icon class="table-icon" />
        </div>
        <div v-else-if="props.column.field == 'vault'" class="table-asset">
          <vault-icon class="table-icon" />
        </div>
        <span v-else>
          {{ props.column.label }}
        </span>
      </template>
      <template slot="table-row" slot-scope="props">
        <span
          :class="rowClassCallback(props.row)"
          :style="{
            color: isFav(props.row.address)
              ? vaultColor(props.row.address, true)
              : '',
            fill: isFav(props.row.address)
              ? vaultColor(props.row.address, true)
              : '',
            fontWeight: isFav(props.row.address) ? 'bold' : 'normal',
          }"
        >
          <span v-if="props.column.field == 'address'">
            <div class="table-wrapper-row">
              <nuxt-link
                v-tooltip="props.row.address"
                class="clickable"
                :style="{
                  color: isFav(props.row.address)
                    ? vaultColor(props.row.address, true)
                    : '',
                  fill: isFav(props.row.address)
                    ? vaultColor(props.row.address, true)
                    : '',
                  fontWeight: isFav(props.row.address) ? 'bold' : 'normal',
                }"
                :to="`/address/${props.row.address}`"
              >
                {{ addressFormatV2(props.row.address, 4, true) }}
              </nuxt-link>
              <Copy :str-copy="props.row.address" />
              <InfoIcon
                class="table-icon"
                @click="gotoNode(props.row.address)"
              />
              <a
                :style="{
                  color: isFav(props.row.address)
                    ? vaultColor(props.row.address, true)
                    : '',
                  fill: isFav(props.row.address)
                    ? vaultColor(props.row.address, true)
                    : '',
                  fontWeight: isFav(props.row.address) ? 'bold' : 'normal',
                }"
                style="height: 1rem"
                :href="gotoNodeUrl(props.row.address)"
                target="_blank"
              >
                <JsonIcon class="table-icon item-link" />
              </a>
              <Ip v-tooltip="props.row.ip" :str-copy="props.row.ip" />
            </div>
          </span>
          <span v-else-if="props.column.field == 'highlight'">
            <StaredIcon
              v-if="isFav(props.row.address)"
              class="table-icon"
              :style="{ fill: vaultColor(props.row.address, true) }"
              @click="delFav(props.row.address)"
            />
            <StarIcon
              v-else
              class="table-icon"
              @click="addFav(props.row.address, props.row.rank)"
            />
          </span>
          <span v-else-if="props.column.field == 'age'">
            <span
              v-if="props.row.age"
              v-tooltip="props.row.age.info"
              style="cursor: pointer"
              >{{ props.row.age.number | number('0,0.00') }}</span
            >
            <span v-else>-</span>
          </span>
          <span v-else-if="props.column.field == 'isp'">
            <cloud-image
              v-if="props.row.isp"
              :name="[props.row.isp, props.row.org]"
            />
            <span v-else>-</span>
          </span>
          <span v-else-if="props.column.field == 'location'">
            <div
              v-if="props.row.location"
              v-tooltip="
                `${props.row.location.code}, ${props.row.location.city}`
              "
              class="countries"
            >
              <VFlag :flag="props.row.location.code" />
            </div>
          </span>
          <span
            v-else-if="props.column.field == 'total_bond'"
            class="hoverable"
          >
            <span v-tooltip="formatCurrency(runePrice * props.row.total_bond)">
              <span class="extra">{{ runeCur() }}</span>
              {{ normalFormat(props.row.total_bond) }}
            </span>
          </span>
          <span v-else-if="props.column.field == 'award'" class="hoverable">
            <span v-tooltip="formatCurrency(runePrice * props.row.award)">
              <span class="extra">{{ runeCur() }}</span>
              {{ props.row.award }}
            </span>
          </span>
          <div v-else-if="props.column.field == 'vault'" class="vault-wrapper">
            <color-hash v-tooltip="props.row.vault" :name="props.row.vault" />
          </div>
          <span v-else-if="props.column.field == 'status'">
            <div
              v-tooltip="props.row.preflight && props.row.preflight.reason"
              :class="[
                'mini-bubble hoverable',
                {
                  yellow: props.row.status == 'Standby',
                  danger: props.row.status == 'Disabled',
                  white: props.row.status == 'Whitelisted',
                },
              ]"
              :style="{
                color: isFav(props.row.address)
                  ? vaultColor(props.row.address, true)
                  : '',
                fill: isFav(props.row.address)
                  ? vaultColor(props.row.address, true)
                  : '',
                fontWeight: isFav(props.row.address) ? 'bold' : 'normal',
              }"
            >
              <span>{{ props.row.status }}</span>
            </div>
          </span>
          <span v-else-if="props.column.field == 'ip'">
            <div v-if="props.row.ip" class="table-wrapper-row">
              <span>{{ props.row.ip }}</span>
              <Copy :str-copy="props.row.ip" />
            </div>
            <span v-else>-</span>
          </span>
          <span v-else-if="props.column.field == 'leave'">
            <div class="table-wrapper-row" style="justify-content: center">
              <ExitIcon
                v-if="props.row.leave == true"
                class="table-icon"
                style="fill: var(--red)"
              />
            </div>
          </span>
          <span v-else-if="props.column.field == 'fee'">
            <span>{{ props.formattedRow[props.column.field] }}</span>
          </span>
          <span v-else-if="props.column.field == 'score'">
            <span>{{
              props.formattedRow[props.column.field] | number('0,0.00')
            }}</span>
          </span>
          <span v-else-if="props.column.field == 'operator'">
            <div
              v-if="props.row.providers && props.row.providers.length > 10"
              style="cursor: pointer"
            >
              <v-menu>
                <div class="hoverable">
                  <nuxt-link
                    class="clickable mono"
                    target="_blank"
                    :to="`/address/${props.row.operator}`"
                    :style="{
                      color: isFav(props.row.address)
                        ? vaultColor(props.row.address, true)
                        : '',
                      fill: isFav(props.row.address)
                        ? vaultColor(props.row.address, true)
                        : '',
                      fontWeight: isFav(props.row.address) ? 'bold' : 'normal',
                    }"
                    >{{ props.row.operator.slice(-4) }}</nuxt-link
                  >
                  <div
                    class="bubble-container grey"
                    @click="openModal(props.row)"
                  >
                    {{ props.row.providers.length }}
                  </div>
                </div>
                <template #popper>
                  <div>Click to see more</div>
                </template>
              </v-menu>
            </div>
            <v-menu v-else>
              <div class="hoverable">
                <nuxt-link
                  class="clickable mono"
                  target="_blank"
                  :to="`/address/${props.row.operator}`"
                  :style="{
                    color: isFav(props.row.address)
                      ? vaultColor(props.row.address, true)
                      : '',
                    fill: isFav(props.row.address)
                      ? vaultColor(props.row.address, true)
                      : '',
                    fontWeight: isFav(props.row.address) ? 'bold' : 'normal',
                  }"
                  >{{ props.row.operator.slice(-4) }}</nuxt-link
                >
                <div
                  v-if="props.row.providers && props.row.providers.length !== 1"
                  class="bubble-container grey"
                >
                  {{ props.row.providers ? props.row.providers.length : 0 }}
                </div>
              </div>
              <template #popper>
                <table class="provider-table">
                  <tr>
                    <th style="text-align: left">Address</th>
                    <th>Bond</th>
                    <th style="text-align: right">Share</th>
                  </tr>
                  <tr
                    v-for="(p, i) in filterProviders(props.row.providers)"
                    :key="i"
                  >
                    <td style="display: flex">
                      <nuxt-link
                        class="hoverable mono external-link"
                        target="_blank"
                        :to="`/address/${p.bond_address}`"
                      >
                        {{ addressFormatV2(p.bond_address, 4, true) }}
                        <external-icon class="asset-icon" />
                      </nuxt-link>
                      <copy
                        :str-copy="p.bond_address"
                        size="small"
                        :hide-toast="true"
                      ></copy>
                    </td>
                    <td class="mono">
                      <small>
                        {{ runeCur() }}
                      </small>
                      {{ $options.filters.number(p.bond / 10 ** 8, '0,0') }}
                    </td>
                    <td style="text-align: right">
                      <span class="mono">
                        {{
                          (p.bond / 10 ** 8 / props.row.total_bond) | percent(2)
                        }}
                      </span>
                    </td>
                  </tr>
                </table>
                <hr />
                <div style="margin-top: 5px">
                  <strong>Operator: </strong>
                  <span class="mono"
                    >{{ props.row.operator.slice(-4) }} -
                    {{ props.formattedRow['fee'] }}</span
                  >
                </div>
              </template>
            </v-menu>
            <div v-else class="hoverable">
              <nuxt-link
                class="clickable mono"
                target="_blank"
                :to="`/address/${props.row.operator}`"
                :style="{
                  color: isFav(props.row.address)
                    ? vaultColor(props.row.address, true)
                    : '',
                  fill: isFav(props.row.address)
                    ? vaultColor(props.row.address, true)
                    : '',
                  fontWeight: isFav(props.row.address) ? 'bold' : 'normal',
                }"
                >{{ props.row.operator.slice(-4) }}</nuxt-link
              >
            </div>
          </span>
          <div v-else-if="props.column.field == 'churn'" class="churn-wrapper">
            <div
              v-for="(churnItem, index) in rows[props.row.originalIndex].churn"
              :key="index"
              class="churn-item"
            >
              <v-menu>
                <component :is="churnItem.icon" class="table-icon" />
                <template #popper>
                  <span v-if="churnItem.type !== 'jail'">
                    {{ churnItem.name }}
                  </span>
                  <div v-else>
                    <strong>{{ churnItem.name.reason | capitalize }}</strong>
                    <div style="margin-top: 0.5rem; padding: 4px">
                      <div>
                        <span>Released Height:</span>
                        <span>{{
                          churnItem.name.release_height | number('0,0')
                        }}</span>
                      </div>
                      <div v-if="churnItem.name.releaseTime">
                        <span>Release Time:</span>
                        <span>{{ churnItem.name.releaseTime }}</span>
                      </div>
                    </div>
                  </div>
                </template>
              </v-menu>
            </div>
            <span
              v-if="
                rows[props.row.originalIndex].churn &&
                rows[props.row.originalIndex].churn.length === 0 &&
                !isFav(props.row.address)
              "
              >-</span
            >
            <div
              v-if="isFav(props.row.address) && name === 'active-nodes'"
              class="rank-wrap"
            >
              <span>
                {{ props.row.rank }}
              </span>
              <progress-icon
                :data-number="rankChange(props.row.address, props.row.rank)"
                :is-down="rankChange(props.row.address, props.row.rank) < 0"
              />
            </div>
          </div>
          <span v-else-if="props.column.field === 'version'">
            <span :class="[{ upgraded: isUpgrading(props.row.version) }]">
              {{ props.formattedRow[props.column.field] }}
            </span>
          </span>
          <span v-else-if="props.column.field.includes('behind.')">
            <span
              v-if="parseInt(props.formattedRow[props.column.field]) == 0"
              :style="{
                color: isFav(props.row.address)
                  ? vaultColor(props.row.address, true)
                  : '',
                fill: isFav(props.row.address)
                  ? vaultColor(props.row.address, true)
                  : '',
                fontWeight: isFav(props.row.address) ? 'bold' : 'normal',
              }"
              class="version"
              >OK</span
            >
            <span v-else-if="props.formattedRow[props.column.field] === ''"
              >-</span
            >
            <span
              v-else-if="
                0 < props.formattedRow[props.column.field] &&
                props.formattedRow[props.column.field] < 10000
              "
              :style="{
                color: isFav(props.row.address)
                  ? vaultColor(props.row.address, true)
                  : '',
                fill: isFav(props.row.address)
                  ? vaultColor(props.row.address, true)
                  : '',
                fontWeight: isFav(props.row.address) ? 'bold' : 'normal',
              }"
              class="number"
              >-{{
                props.formattedRow[props.column.field] | number('0a')
              }}</span
            >
            <DangerIcon
              v-else-if="
                0 > props.formattedRow[props.column.field] &&
                props.formattedRow[props.column.field] > -10000
              "
              v-tooltip="'Disabled'"
              class="table-icon"
              style="color: #ef5350"
            />
            <DangerIcon
              v-else-if="props.formattedRow[props.column.field] > 10000"
              v-tooltip="`${props.formattedRow[props.column.field]}`"
              class="table-icon"
              style="fill: #ffc107"
            />
            <DangerIcon
              v-else
              v-tooltip="`${props.formattedRow[props.column.field]}`"
              class="table-icon"
              style="fill: #ef5350"
            />
          </span>
          <span v-else>
            {{ props.formattedRow[props.column.field] }}
          </span>
        </span>
      </template>
    </vue-good-table>
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Operator Details</h3>
          <CrossIcon class="close-btn" @click="closeModal" />
        </div>
        <table class="modal-table">
          <tr>
            <th style="text-align: left">Address</th>
            <th>Bond</th>
            <th style="text-align: right">Share</th>
          </tr>
          <tr v-for="(p, i) in filterProviders(selectedRow.providers)" :key="i">
            <td style="display: flex">
              <nuxt-link
                class="hoverable mono external-link"
                target="_blank"
                :to="`/address/${p.bond_address}`"
              >
                {{ addressFormatV2(p.bond_address, 4, true) }}
                <external-icon class="asset-icon" />
              </nuxt-link>
              <copy
                :str-copy="p.bond_address"
                size="small"
                :hide-toast="true"
              ></copy>
            </td>
            <td class="mono">
              <small>
                {{ runeCur() }}
              </small>
              {{ $options.filters.number(p.bond / 10 ** 8, '0,0') }}
            </td>
            <td style="text-align: right">
              <span class="mono">
                {{ (p.bond / 10 ** 8 / selectedRow.total_bond) | percent(2) }}
              </span>
            </td>
          </tr>
        </table>
        <div class="footer-table">
          <strong>Operator:</strong>
          <span class="mono" style="margin-left: 5px">
            <nuxt-link
              class="clickable"
              :to="`/address/${selectedRow.operator}`"
              target="_blank"
            >
              {{ selectedRow.operator.slice(-4) }}
            </nuxt-link>
            - {{ selectedRow.fee }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { mapGetters } from 'vuex'
import { remove, orderBy } from 'lodash'
import { rcompare } from 'semver'

import { props } from 'qrcode.vue'
import JsonIcon from '@/assets/images/json.svg?inline'
import InfoIcon from '@/assets/images/info.svg?inline'
import StarIcon from '@/assets/images/bookmark.svg?inline'
import StaredIcon from '@/assets/images/bookmarked.svg?inline'
import ExitIcon from '@/assets/images/arrow-down-square.svg?inline'
import VoteIcon from '@/assets/images/vote.svg?inline'
import DangerIcon from '@/assets/images/danger.svg?inline'
import MarkerIcon from '@/assets/images/marker.svg?inline'
import RecycleIcon from '@/assets/images/recycle.svg?inline'
import ExternalIcon from '@/assets/images/external.svg?inline'
import VaultIcon from '@/assets/images/safe.svg?inline'
import HighlightList from '@/assets/images/highlight-list.svg?inline'
import CrossIcon from '~/assets/images/cross.svg?inline'

export default {
  components: {
    CrossIcon,
    JsonIcon,
    InfoIcon,
    StarIcon,
    StaredIcon,
    ExitIcon,
    VoteIcon,
    RecycleIcon,
    MarkerIcon,
    DangerIcon,
    HighlightList,
    ExternalIcon,
    VaultIcon,
  },
  props: ['rows', 'cols', 'name', 'searchTerm', 'sortColumn', 'sortOrder'],
  data() {
    return {
      favs: [],
      showModal: false,
      selectedRow: null,
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
    }),
  },
  watch: {
    favs(array) {
      localStorage.setItem(this.name, JSON.stringify(array))
    },
  },
  mounted() {
    this.favs = JSON.parse(localStorage.getItem(this.name)) || []
    this.loadRank()
    window.addEventListener('visibilitychange', this.unloadRank)
  },
  methods: {
    rankChange(address, rank) {
      const na = this.favs.find((f) => f.address === address)
      return na.rank - rank
    },
    openModal(row) {
      this.selectedRow = row
      this.showModal = true
    },
    closeModal() {
      this.showModal = false
      this.selectedRow = null
    },
    loadRank() {
      const value = this.rows
      if (this.name === 'active-nodes' && this.favs.length > 0) {
        for (let na = 0; na < value.length; na++) {
          this.favs.forEach((f, i) => {
            if (f.address === value[na].address) {
              if (!this.favs[i].lastRank) {
                this.favs[i].lastRank = this.favs[i].rank
              }
              this.favs[i].rank = this.favs[i].lastRank
            }
          })
        }
      }
    },
    unloadRank() {
      const value = this.rows
      if (this.name === 'active-nodes' && this.favs.length > 0) {
        let changed = false
        for (let na = 0; na < value.length; na++) {
          this.favs.forEach((f, i) => {
            if (f.address === value[na].address && f.lastRank !== na + 1) {
              this.favs[i].lastRank = na + 1
              changed = true
            }
          })
        }
        if (changed) {
          localStorage.setItem(this.name, JSON.stringify(this.favs))
        }
      }
    },
    isUpgrading(ver) {
      if (this.name !== 'active-nodes' || !this.rows) {
        return false
      }

      const onlyUnique = (value, index, array) => {
        return array.indexOf(value) === index
      }

      const nodesVersion = this.rows.map((r) => r.version).sort(rcompare)
      const versions = nodesVersion.filter(onlyUnique)
      if (versions.length > 1 && ver === versions[0]) {
        return true
      }
      return false
    },
    filterProviders(arr) {
      if (!arr) {
        return []
      }
      return orderBy(
        arr?.map((a) => ({ ...a, bond: +a.bond })),
        ['bond'],
        ['desc']
      )
    },
    rowClassCallback(row) {
      const classes = ['table-row']
      if (row.churn?.length > 0) {
        if (
          row.churn.some((e) => e.type === 'churn-out' || e.type === 'leave')
        ) {
          classes.push('churning-out')
        }

        if (row.churn.some((e) => e.type === 'churn-in')) {
          classes.push('churning-in')
        }
      }

      return classes.join(' ')
    },
    addFav(address, rank) {
      if (address) {
        this.favs = [...this.favs, { address, rank, lastRank: rank }]
      }
    },
    delFav(address) {
      const favs = this.favs
      remove(favs, (n) => {
        return n.address === address
      })
      this.favs = [...favs]
    },
    isFav(address) {
      if (this.favs && this.favs.map((f) => f.address).includes(address)) {
        return true
      }
      return false
    },
    handleSortChange(params) {
      if (!params || !params[0] || !params[0].field) {
        console.error('Sorting parameters are undefined or invalid:', params)
        return
      }
      this.$emit('sort-changed', {
        column: params[0].field,
        order: params[0].type,
      })
    },
  },
}
</script>

<style lang="scss" scoped>
.number {
  color: #ffc107;
}
.version {
  color: var(--primary-color);
}
.asset-chain {
  height: 1.2rem;
  border-radius: $radius-full;
}
.popover-table {
  display: flex;
  justify-content: space-between;
  gap: 20px;

  > * {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 5px;
  }

  .text {
    color: var(--font-color);
  }

  .vote-value {
    justify-content: end;
  }
}

.countries {
  display: flex;
  cursor: pointer;
  gap: 10px;
  align-items: center;
  justify-content: center;
}
.grid-network {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(auto, 1fr));
  grid-gap: 0.5rem;
  gap: 0.5rem;
}

.extra {
  font-size: $font-size-xs;
}

.node-table {
  font-size: 80% !important;
}

.item-link {
  text-decoration: none;
  color: inherit;
  &:hover {
    color: var(--primary-color);
  }
}

.provider-table {
  td {
    &:first-of-type {
      padding-right: $space-16;
    }

    &:last-of-type {
      padding-left: $space-16;
    }
  }
}

.churn-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.providers {
  max-width: 80px;
  width: 80px;
  min-width: 80px;
}
.upgraded {
  color: var(--active-primary-color);
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: var(--card-bg-color);
  border-radius: $radius-lg;
  text-align: left;
  color: var(--sec-font-color);
  width: 300px;
  max-height: 36rem;
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow-y: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.6);

  > div {
    padding: $space-18;
  }
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: $space-10;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  font-size: $font-size-md;
  margin: $space-0;
  color: var(--sec-font-color);
}

.modal-table {
  width: 100%;

  th,
  td {
    padding: $space-8;
    text-align: left;
    font-size: $font-size-sm;
  }

  th {
    background-color: var(--border-color);
  }
}

.close-btn {
  cursor: pointer;
  width: 1.5rem;
  height: 2rem;
  color: var(--sec-font-color);

  &:hover {
    color: var(--primary-color);
  }
}
.footer-table {
  font-size: $font-size-sm;
  display: flex;
  align-content: center;
  justify-content: center;
  align-items: center;
  border-top: 1px solid var(--border-color);
}

.rank-wrap {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: $font-size-xs;
  background: var(--active-bg-color);
  padding: $space-3;
  border-radius: $radius-sm;
  color: var(--sec-font-color);

  .arrow-container {
    font-size: $font-size-xxs;
  }
}

.vault-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
