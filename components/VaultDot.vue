<template>
  <VDropdown
    theme="dropdown"
    placement="bottom-start"
    popper-class="vault-popper"
    class="vault-dropdown"
    :distance="8"
    :triggers="['hover', 'click']"
    :hide-triggers="['hover']"
    :popper-triggers="['hover']"
    :delay="{ show: 60, hide: 250 }"
    @click.native.stop
  >
    <span :class="['vault-dot-hit', { compact }]">
      <color-hash :name="pubKey" />
    </span>
    <template #popper>
      <div class="tooltip-header">
        <color-hash :name="pubKey" />
        <span>Asgard Vault</span>
        <span
          v-if="status"
          :class="['mini-bubble', { yellow: status === 'Retiring' }]"
        >
          {{ status }}
        </span>
      </div>
      <div class="tooltip-body vault-popover">
        <div v-if="count > 0" class="vault-count">
          <span class="vault-count-value mono">{{ count }}</span>
          {{ count === 1 ? 'outbound' : 'outbounds' }} from this vault
        </div>
        <div class="vault-row">
          <span class="vault-label">Vault Pub Key</span>
          <span class="vault-value mono">
            {{ addressFormatV2(pubKey) }}
            <copy :str-copy="pubKey" size="small" :hide-toast="true" />
          </span>
        </div>
        <div v-if="address" class="vault-row">
          <span class="vault-label">{{ chain }} Vault Address</span>
          <span class="vault-value mono">
            <NuxtLink class="clickable" :to="{ path: `/address/${address}` }">
              {{ addressFormatV2(address) }}
            </NuxtLink>
            <copy :str-copy="address" size="small" :hide-toast="true" />
          </span>
        </div>
        <span v-else class="vault-missing">Vault details unavailable</span>
      </div>
    </template>
  </VDropdown>
</template>

<script>
export default {
  props: {
    pubKey: {
      type: String,
      required: true,
    },
    // Asgard vault entry for this pub key, when it is still in the vault set.
    vault: {
      type: Object,
      default: undefined,
    },
    chain: {
      type: String,
      default: undefined,
    },
    // Outbounds handled by this vault; omitted where a single one is shown.
    count: {
      type: Number,
      default: 0,
    },
    // Tightens the touch target for dots sitting side by side in a cluster,
    // where a full-size one would overlap its neighbours.
    compact: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    status() {
      const status = this.vault?.status
      if (status === 'ActiveVault') return 'Active'
      if (status === 'RetiringVault') return 'Retiring'
      return status
    },
    address() {
      if (!this.chain) return undefined
      return this.vault?.addresses?.find((a) => a.chain === this.chain)?.address
    },
  },
}
</script>

<style lang="scss" scoped>
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

    &.compact {
      padding: $space-3;
      margin: -$space-3;
    }
  }
}

.vault-popover {
  min-width: 200px;

  .vault-count {
    font-size: 11px;
    color: var(--sec-font-color);
    padding-bottom: $space-5;
    border-bottom: 1px solid var(--border-color);
  }

  .vault-count-value {
    color: var(--primary-color);
    font-weight: 600;
  }

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
