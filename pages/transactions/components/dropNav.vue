<template>
  <div class="nav-box-wrapper">
    <div
      v-for="it in items"
      :id="it.title"
      :key="it.title"
      :ref="it.title"
      :class="['nav-box-item', {'active': isItemActive(it)}]"
      @mouseover="toggle(it, true)"
      @mouseleave="toggle(it, false)"
      @click="emitIfNoSubs(it)"
    >
      <div class="nav-box-mainframe">
        <span>{{ it.title }}</span>
      </div>
      <template v-if="it.subItems && it.subItems.length > 0">
        <transition name="fade">
          <div v-show="toggles[it.title]" :id="it.title" :ref="it.title">
            <div class="nav-box-dialog simple-card normal">
              <div
                v-for="su in it.subItems"
                :key="su.name"
                :class="['nav-item', {'active': su.value === activeMode}]"
                @click="emitAction(su.value)"
              >
                <span>{{ su.name }}</span>
              </div>
            </div>
          </div>
        </transition>
      </template>
    </div>
  </div>
</template>

<script>
export default {
  props: ['items', 'activeMode'],
  data () {
    return {
      toggles: {}
    }
  },
  mounted () {
    // Create toggles
    for (let i = 0; i < this.items.length; i++) {
      this.$set(this.toggles, this.items[i].title, false)
      this.closeDialogOnClick(this.items[i])
    }
  },
  methods: {
    toggle (item, flag = undefined) {
      const st = item.title
      if (this.toggles[st] === undefined) {
        return
      }
      if (flag === undefined) {
        this.toggles[st] = !this.toggles[st]
      } else {
        this.toggles[st] = flag
      }
    },
    closeDialogOnClick (item) {
      window.addEventListener('click', (e) => {
        if (!document.getElementById(item.title)?.contains(e.target)) {
          this.toggles[item.title] = false
        }
      })
    },
    emitIfNoSubs (item) {
      if (item.subItems === undefined || item.subItems.length === 0) {
        this.emitAction(item.value)
      }
    },
    emitAction (value) {
      this.$emit('update:activeMode', value)
    },
    isItemActive (it) {
      if (this.activeMode === it.value || it.subItems?.map(s => s.value).includes(this.activeMode)) {
        return true
      }
      return false
    }
  }
}
</script>

<style lang="scss">
.nav-box-wrapper {
  margin-bottom: 10px;
  display: flex;
  gap: 10px;

  .nav-box-item {
    position: relative;

    &.active {
      .nav-box-mainframe span {
        color: var(--primary-color);
      }
    }

    .nav-box-mainframe {
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      background-color: var(--card-bg-color);
      border: 1px solid var(--border-color);
      min-width: 100px;
      display: flex;
      justify-content: center;
      cursor: pointer;

      span {
        text-align: center;
        color: var(--sec-font-color);
      }
    }

    .nav-box-dialog {
      position: absolute;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      min-width: 100px;
      margin-top: .3rem;
      left: 50%;
      transform: translateX(-50%);

      .nav-item {
        cursor: pointer;
        background: var(--card-bg-color);
        color: var(--font-color);
        border: none;
        padding: 0.5rem 1rem;
        text-decoration: none;
        text-align: center;

        span {
          white-space: nowrap;
          color: var(--sec-font-color);
        }

        &.active {
          span {
            color: var(--primary-color);
          }
        }

        &:first-of-type {
          border-radius: 0.5rem 0.5rem 0 0;
        }

        &:last-of-type {
          border-radius: 0 0 0.5rem 0.5rem;
        }

        &:hover {
          background: var(--darker-bg);
          color: var(--primary-color);
        }

        &.active {
          color: var(--primary-color);

          &:hover {
            background-color: var(--card-bg-color);
          }
        }
      }
    }
  }
}
</style>
