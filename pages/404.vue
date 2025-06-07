<template>
  <ErrorLayout :error="error" />
</template>

<script>
import ErrorLayout from '~/layouts/error.vue'

export default {
  components: { ErrorLayout },
  layout: 'error',
  async asyncData({ error }) {
    error({ statusCode: 404, message: 'Page Not Found' })
  },
  data() {
    return {
      error: {
        statusCode: 404,
      },
    }
  },
}
</script>
