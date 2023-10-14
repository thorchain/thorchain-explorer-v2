<template>
    <div class="modal">
        <transition name="fade-up">
            <div v-show="showPopper" class="simple-card normal menu">
                <a v-for="ie in interfaces" :href="ie.url" target="_blank" class="interface">
                    <img v-if="ie.img" :src="ie.img" alt="interface-icon" class="interface-icon">
                    <span>{{ ie.name }}</span>
                </a>
            </div>
        </transition>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
    components: {
    },
    props: [],
    data () {
        return {}
    },
    computed: {
        ...mapGetters({
            showPopper: 'getPopper',
            interfaces: 'getInterfaces'
        })
    },
    methods: {
    }
}
</script>

<style lang="scss" scoped>
.modal {
  .menu {
    z-index: 1000;
    display: flex;
    position: absolute;
    padding: 0.2rem 0;
    right: calc(100% + 10px);
    top: 0;

    a {
      display: flex;
      align-items: center;
      color: var(--font-color);
      text-decoration: none;
      padding: 0.5rem;
      border-radius: 0.2rem;
      margin: 0 0.2rem;
      gap: 10px;
      font-family: "Exo 2";
      font-size: 0.9rem;
      text-wrap: nowrap;

      .menu-icon {
        fill: inherit;
        widows: 1rem;
        height: 1rem;
      }

      &:hover {
        background-color: var(--darker-bg);
      }

      .menu-icon {
        width: 1.3rem;
        height: 1.3rem;
      }
    }
  }
}
</style>
  