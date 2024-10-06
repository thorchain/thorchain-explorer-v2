<template>
  <div class="error-container">
    <div class="error-404">
      <img src="@/assets/images/404.svg" />
    </div>
    <div class="error-message">
      <h2>Page Not Found</h2>
      <p>
        Sorry, the page you're looking for does not exist or has been moved.
      </p>
      <NuxtLink to="/" class="back-home">Go back Home</NuxtLink>
    </div>
  </div>
</template>

<script>
export default {
  props: ['error'],
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

  .error-404 {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    flex-direction: column;
    display: flex;

    img {
      width: 17rem;
    }
    h1 {
      margin: 0;
    }

    p {
      font-size: 1rem;
      color: var(--color-light);
    }
    @include sm {
      img {
        width: 35rem;
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
