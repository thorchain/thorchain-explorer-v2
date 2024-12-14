<template>
  <div>
    <div class="tx-container">
      <div class="swap">
        <div class="amount">
          <skeleton-loader :style="{ width: '4rem' }" />
        </div>
        <div class="value">
          <skeleton-loader :style="{ width: '7rem' }" />
        </div>
      </div>

      <div class="tx-details">
        <div class="tx-info">
          <skeleton-loader
            class="skeleton"
            :style="{ height: '36px', width: '36px', borderRadius: '50%' }"
          />
          <div class="info-value">
            <skeleton-loader :style="{ width: '8rem', height: '0.5rem' }" />
            <div style="display: flex; justify-content: center">
              <skeleton-loader :style="{ width: '4rem', height: '0.5rem' }" />
            </div>
          </div>
        </div>

        <div class="tx-info">
          <div class="info-value">
            <skeleton-loader :style="{ width: '8rem', height: '0.5rem' }" />
            <div style="display: flex; justify-content: center">
              <skeleton-loader :style="{ width: '4rem', height: '0.5rem' }" />
            </div>
          </div>
          <skeleton-loader
            class="skeleton"
            :style="{ height: '36px', width: '36px', borderRadius: '50%' }"
          />
        </div>
      </div>

      <div v-for="i in 3" :key="i" class="section">
        <div class="header-skeleton">
          <skeleton-loader :style="{ width: '4rem' }" />
          <skeleton-loader
            :style="{ width: '5rem', height: '1rem', borderRadius: '5px' }"
          />
        </div>
        <div class="line"></div>
        <div class="section-item">
          <div class="header-skeleton">
            <skeleton-loader :style="{ width: '8rem', height: '0.5rem' }" />
            <skeleton-loader :style="{ width: '15rem', height: '0.5rem' }" />
          </div>
          <div class="header-skeleton">
            <skeleton-loader :style="{ width: '8rem', height: '0.5rem' }" />
            <skeleton-loader :style="{ width: '15rem', height: '0.5rem' }" />
          </div>
          <div class="header-skeleton">
            <skeleton-loader :style="{ width: '8rem', height: '0.5rem' }" />
            <skeleton-loader :style="{ width: '15rem', height: '0.5rem' }" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {}
</script>

<style lang="scss" scoped>
.skeleton {
  margin: 0px !important;
}
.header-skeleton {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
}
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
  margin: 13px 3px;
}
.tx-info {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  display: flex;
  flex-direction: row;
  gap: 1rem;
  padding: 8px;
  align-items: center;
  justify-content: center;
}
.info-value {
  display: flex;
  flex-direction: column;
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
  padding: 0;
}

.section {
  margin-top: 1.5rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.section-item {
  display: flex;
  flex-direction: column;
  margin: 0.5rem 0 5px;
}
</style>
