<template>
  <page>
    <div class="error-container">
      <div class="error-404">
        <Lost v-if="is404" />
        <GenericErrorIcon
          v-else
          style="width: 15rem; fill: var(--sec-font-color)"
        />
      </div>
      <div class="error-message">
        <h2>{{ is404 ? 'Page Not Found' : 'Something Went Wrong!' }}</h2>
        <p>
          {{
            is404
              ? "Sorry, the page you're looking for does not exist or has been moved."
              : 'Something went wrong.'
          }}
        </p>
        <NuxtLink v-if="is404" to="/" class="back-home">Go back Home</NuxtLink>
      </div>
    </div>
  </page>
</template>

<script>
import Lost from '~/assets/images/404.svg?inline'
import GenericErrorIcon from '~/assets/images/warning.svg?inline'

export default {
  components: { Lost, GenericErrorIcon },
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
      margin: 0;
    }

    p {
      font-size: 1rem;
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
    margin-top: 5px;
    padding: 10px 20px;
    background-color: var(--primary-color);
    color: var(--bg-color);
    border-radius: 5px;
    text-decoration: none;
    margin: 0.5rem;
  }
}
</style>
