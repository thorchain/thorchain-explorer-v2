<template>
  <page>
    <div class="error-container">
      <div class="error-404">
        <Lost v-if="is404" />
        <error-icon v-else />
      </div>
      <div class="error-message">
        <h2>{{ is404 ? 'Page Not Found' : 'Something Went Wrong' }}</h2>
        <p>
          {{
            is404
              ? "Sorry, the page you're looking for does not exist or has been moved."
              : 'An unusual behavior happened, please let the devs know!'
          }}
        </p>
        <nuxt-link to="/" class="back-home">Go back Home</nuxt-link>
      </div>
    </div>
  </page>
</template>

<script>
import Lost from '~/assets/images/404.svg?inline'
import ErrorIcon from '~/assets/images/500.svg?inline'

export default {
  components: { Lost, ErrorIcon },
  props: ['error'],
  computed: {
    is404() {
      return this.error && this.error.statusCode === 404
    },
  },
}
</script>

<style lang="scss" scoped>
.error-container {
  background-image: url('@/assets/images/stars.svg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  text-align: center;
  width: 100%;
  height: 100%;
  flex-direction: column;
  display: flex;
  padding: 3rem 1rem;

  .error-404 {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    flex-direction: column;

    svg {
      flex: 1;
      max-width: 17rem;
    }

    h1 {
      margin: $space-0;
    }

    p {
      font-size: $font-size-desktop;
      color: var(--color-light);
    }
    @include sm {
      svg {
        max-width: 32rem;
      }
    }
  }
  .back-home {
    display: inline-block;
    margin-top: $space-5;
    padding: 10px 20px;
    background-color: var(--primary-color);
    color: var(--bg-color);
    border-radius: $radius-s;
    text-decoration: none;
    margin: $space-8;
  }
}
</style>
