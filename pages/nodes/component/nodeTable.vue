<template>
  <vue-good-table
    v-if="rows"
    :key="1"
    :columns="cols"
    :rows="rows"
    style-class="vgt-table net-table bordered condensed node-table"
    :line-numbers="true"
    :row-style-class="rowClassCallback"
  >
    <template slot="table-column" slot-scope="props">
      <div v-if="props.column.field.includes('behind')" class="table-asset">
        <img
          class="asset-chain"
          :src="assetImage(`${props.column.label}.${props.column.label}`)"
        />
      </div>
      <div v-else-if="props.column.field == 'leave'" v-tooltip="'Provider'">
        <ExitIcon class="table-icon" />
      </div>
      <div v-else-if="props.column.field == 'providers'">Operator</div>
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
        <ranking-icon class="table-icon" />
      </div>
      <span v-else>
        {{ props.column.label }}
      </span>
    </template>
    <template slot="table-row" slot-scope="props">
      <span v-if="props.column.field == 'address'">
        <div class="table-wrapper-row">
          <nuxt-link
            v-tooltip="props.row.address"
            class="clickable"
            :to="`/address/${props.row.address}`"
          >
            {{ addressFormatV2(props.row.address, 4, true) }}
          </nuxt-link>
          <Copy :str-copy="props.row.address" />
          <InfoIcon class="table-icon" @click="gotoNode(props.row.address)" />
          <a
            style="height: 1rem"
            :href="gotoNodeUrl(props.row.address)"
            target="_blank"
          >
            <JsonIcon class="table-icon item-link" />
          </a>
          <Ip :str-copy="props.row.ip" />
        </div>
      </span>
      <span v-else-if="props.column.field == 'highlight'">
        <StaredIcon
          v-if="isFav(props.row.address)"
          class="table-icon"
          style="fill: var(--highlight)"
          @click="delFav(props.row.address)"
        />
        <StarIcon
          v-else
          class="table-icon"
          @click="addFav(props.row.address)"
        />
      </span>
      <span v-else-if="props.column.field == 'age'">
        <span
          v-if="props.row.age"
          v-tooltip="props.row.age.text"
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
          v-tooltip="`${props.row.location.code}, ${props.row.location.city}`"
          class="countries"
        >
          <VFlag :flag="props.row.location.code" />
        </div>
      </span>
      <span v-else-if="props.column.field == 'total_bond'" class="hoverable">
        <span v-tooltip="formatCurrency(runePrice * props.row.total_bond)">
          <span class="extra">{{ runeCur() }}</span>
          {{ numberFormat(props.row.total_bond) }}
        </span>
      </span>
      <span v-else-if="props.column.field == 'award'" class="hoverable">
        <span v-tooltip="formatCurrency(runePrice * props.row.award)">
          <span class="extra">{{ runeCur() }}</span>
          {{ props.row.award }}
        </span>
      </span>
      <span v-else-if="props.column.field == 'status'">
        <div
          :class="[
            'mini-bubble',
            {
              yellow: props.row.status == 'Standby',
              danger: props.row.status == 'Disabled',
              white: props.row.status == 'Whitelisted',
            },
          ]"
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
          <span v-else>-</span>
        </div>
      </span>
      <span v-else-if="props.column.field == 'fee'">
        <span>{{ props.formattedRow[props.column.field] }}</span>
      </span>
      <span v-else-if="props.column.field == 'providers'">
        <span>{{ props.row.operator.slice(-4) }}</span>
        <div
          :id="props.row.providers.length ? `popover-${props.row.ip}` : false"
          class="bubble-container grey clickable"
        >
          {{ props.row.providers.length }}
        </div>
        <b-popover
          triggers="hover focus"
          :target="`popover-${props.row.ip}`"
          custom-class="custom-popover"
        >
          <div class="title" style="margin-bottom: 5px">
            <strong>Providers</strong>
          </div>
          <table class="provider-table">
            <tr v-for="(p, i) in filterProviders(props.row.providers)" :key="i">
              <td>
                <nuxt-link
                  class="clickable mono"
                  :to="`/address/${p.bond_address}`"
                >
                  {{ addressFormatV2(p.bond_address, 4, true) }}
                </nuxt-link>
              </td>
              <td class="mono">
                <small>
                  {{ runeCur() }}
                </small>
                {{ $options.filters.number(p.bond / 10 ** 8, '0,0') }}
              </td>
              <td style="text-align: right">
                <span class="mono">
                  {{ (p.bond / 10 ** 8 / props.row.total_bond) | percent }}
                </span>
              </td>
            </tr>
          </table>
        </b-popover>
      </span>
      <span v-else-if="props.column.field.includes('behind.')">
        <span
          v-if="props.formattedRow[props.column.field] == 0"
          style="color: #81c784"
          >OK</span
        >
        <span
          v-else-if="
            0 < props.formattedRow[props.column.field] &&
            props.formattedRow[props.column.field] < 10000
          "
          style="color: #ffc107"
          >{{ props.formattedRow[props.column.field] }}</span
        >
        <span
          v-else-if="
            0 > props.formattedRow[props.column.field] &&
            props.formattedRow[props.column.field] > -10000
          "
          style="color: #ef5350"
          >{{ props.formattedRow[props.column.field] }}</span
        >
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
    </template>
  </vue-good-table>
</template>
<script>
import { mapGetters } from 'vuex'
import { remove, orderBy, compact } from 'lodash'
import JsonIcon from '@/assets/images/json.svg?inline'
import InfoIcon from '@/assets/images/info.svg?inline'
import StarIcon from '@/assets/images/bookmark.svg?inline'
import StaredIcon from '@/assets/images/bookmarked.svg?inline'
import ExitIcon from '@/assets/images/sign-out.svg?inline'
import VoteIcon from '@/assets/images/vote.svg?inline'
import DangerIcon from '@/assets/images/danger.svg?inline'
import MarkerIcon from '@/assets/images/marker.svg?inline'
import RankingIcon from '@/assets/images/ranking.svg?inline'
import HighlightList from '@/assets/images/highlight-list.svg?inline'

export default {
  components: {
    JsonIcon,
    InfoIcon,
    StarIcon,
    StaredIcon,
    ExitIcon,
    VoteIcon,
    RankingIcon,
    MarkerIcon,
    DangerIcon,
    HighlightList,
  },
  props: ['rows', 'cols', 'name'],
  data() {
    return {
      favs: [],
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
  },
  methods: {
    filterProviders(arr) {
      return orderBy(
        arr.map((a) => ({ ...a, bond: +a.bond })),
        ['bond'],
        ['desc']
      )
    },
    rowClassCallback(row) {
      return this.isFav(row.address) ? 'highlight table-row' : 'table-row'
    },
    addFav(address) {
      if (address) {
        this.favs = [...this.favs, address]
      }
    },
    delFav(address) {
      const favs = this.favs
      remove(favs, (n) => {
        return n === address
      })
      this.favs = [...favs]
    },
    isFav(address) {
      if (this.favs && this.favs.includes(address)) {
        return true
      }
      return false
    },
  },
}
</script>

<style lang="scss" scoped>
.asset-chain {
  height: 1.2rem;
  border-radius: 50%;
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
  font-size: 0.7rem;
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
      padding-right: 1rem;
    }

    &:last-of-type {
      padding-left: 1rem;
    }
  }
}
</style>
