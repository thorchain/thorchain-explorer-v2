<template>
  <div>
    <div class="tx-container">
      <div class="swap">
        <div class="amount">
          <skeleton-loader :style="{ height: '0.5rem', width: '4rem' }" />
        </div>
        <div class="value">
          <skeleton-loader :style="{ height: '0.5rem', width: '7rem' }" />
        </div>
      </div>

      <div class="tx-details">
        <div>
          <skeleton-loader :style="{ height: '2rem', width: '2rem' }" />
        </div>
        <div>
          <skeleton-loader :style="{ height: '0.5rem', width: '7.5rem' }" />
        </div>
        <div>
          <skeleton-loader :style="{ height: '2rem', width: '2rem' }" />
        </div>
        <div>
          <skeleton-loader :style="{ height: '0.5rem', width: '7.5rem' }" />
        </div>
        <div>
          <skeleton-loader :style="{ height: '2rem', width: '2rem' }" />
        </div>
      </div>

      <div class="tx-value">
        <div>
          <skeleton-loader :style="{ height: '0.5rem', width: '7rem' }" />
          <skeleton-loader :style="{ height: '0.5rem', width: '7rem' }" />
        </div>
        <div>
          <skeleton-loader :style="{ height: '0.5rem', width: '7rem' }" />
          <skeleton-loader :style="{ height: '0.5rem', width: '7rem' }" />
        </div>
      </div>

      <div class="section" v-for="i in 3" :key="i">
        <div class="line"></div>
        <skeleton-loader :style="{ height: '0.5rem', width: '4rem' }" />
        <div class="section-item">
          <skeleton-loader />
          <skeleton-loader />
          <skeleton-loader />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {}
</script>

<style lang="scss" scoped>
.tx-container {
  padding: 20px;
  border-radius: 10px;
  max-width: 640px;
  margin: auto;
  background-color: var(--card-bg-color);
  border: 1px solid var(--border-color);
}

.tx-details,
.tx-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.swap {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
}

.line {
  border-bottom: 1px solid var(--border-color);
  margin: 0.5rem 0 10px;
  padding: 0.5rem;
}

.section-item {
  display: flex;
  flex-direction: column;
  margin: 0.5rem 0 5px;
}
</style>
