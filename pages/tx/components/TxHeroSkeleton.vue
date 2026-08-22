<template>
  <div class="tx-detail-page">
    <div class="tx-detail-back">
      <nuxt-link to="/txs" class="tx-back-link">
        <ArrowIcon class="tx-back-icon" />
        All Transactions
      </nuxt-link>
    </div>

    <div class="tx-detail-meta">
      <skeleton-loader :style="{ width: '90px', height: '0.85rem' }" />
      <skeleton-loader
        :style="{ width: '90px', height: '1.5rem', borderRadius: '999px' }"
      />
      <skeleton-loader
        :style="{ width: '110px', height: '1.5rem', borderRadius: '999px' }"
      />
    </div>

    <h1 class="tx-detail-title tx-detail-title--skeleton">
      <skeleton-loader :style="{ width: '85%', height: '1.6rem' }" />
      <skeleton-loader :style="{ width: '45%', height: '1.6rem' }" />
    </h1>

    <div class="tx-detail-grid">
      <div class="tx-detail-main">
        <section class="tx-swap-card card-bg">
          <div class="tx-swap-head">
            <div class="tx-asset-panel">
              <div class="tx-asset-label">
                <skeleton-loader :style="{ width: '40px', height: '0.6rem' }" />
              </div>
              <div class="tx-asset-primary">
                <skeleton-loader
                  :style="{
                    width: '2.25rem',
                    height: '2.25rem',
                    borderRadius: '50%',
                  }"
                />
                <skeleton-loader
                  :style="{ width: '120px', height: '1.1rem' }"
                />
              </div>
              <skeleton-loader :style="{ width: '70%', height: '0.9rem' }" />
            </div>

            <div class="tx-swap-arrow" />

            <div class="tx-asset-panel tx-asset-panel--accent">
              <div class="tx-asset-label">
                <skeleton-loader :style="{ width: '48px', height: '0.6rem' }" />
              </div>
              <div class="tx-asset-primary">
                <skeleton-loader
                  :style="{
                    width: '2.25rem',
                    height: '2.25rem',
                    borderRadius: '50%',
                  }"
                />
                <skeleton-loader
                  :style="{ width: '130px', height: '1.1rem' }"
                />
              </div>
              <skeleton-loader :style="{ width: '65%', height: '0.9rem' }" />
            </div>
          </div>

          <div class="tx-metric-strip">
            <div v-for="i in 3" :key="i" class="tx-metric-item">
              <div class="tx-asset-label">
                <skeleton-loader :style="{ width: '55px', height: '0.6rem' }" />
              </div>
              <div class="tx-metric-value">
                <skeleton-loader :style="{ width: '75%', height: '0.85rem' }" />
              </div>
            </div>
          </div>
        </section>

        <section class="tx-info-card card-bg">
          <div class="tx-section-title">Details</div>
          <div class="tx-detail-rows">
            <div
              v-for="row in detailRowWidths"
              :key="row.label"
              class="tx-detail-row"
            >
              <div class="tx-detail-key">
                <skeleton-loader
                  :style="{ width: row.label, height: '0.8rem' }"
                />
              </div>
              <div class="tx-detail-value tx-detail-value--skeleton">
                <skeleton-loader
                  :style="{ width: row.value, height: '0.8rem' }"
                />
              </div>
            </div>
          </div>
        </section>

        <section class="tx-info-card card-bg">
          <div class="tx-section-title">
            <skeleton-loader :style="{ width: '150px', height: '0.85rem' }" />
          </div>
          <div class="tx-lifecycle-list">
            <div v-for="i in 2" :key="i" class="tx-lifecycle-item">
              <div class="tx-lifecycle-dot tx-lifecycle-dot--skeleton" />
              <div class="tx-lifecycle-copy">
                <div class="tx-lifecycle-title">
                  <skeleton-loader
                    :style="{ width: '55%', height: '0.9rem' }"
                  />
                </div>
                <div class="tx-lifecycle-body">
                  <skeleton-loader
                    :style="{ width: '90%', height: '0.8rem' }"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div class="tx-detail-side">
        <section class="tx-info-card card-bg">
          <div class="tx-section-title">
            <skeleton-loader :style="{ width: '160px', height: '0.85rem' }" />
          </div>
          <div class="tx-hash-box">
            <div class="tx-asset-label">
              <skeleton-loader :style="{ width: '55px', height: '0.6rem' }" />
            </div>
            <div class="tx-hash-full tx-hash-full--skeleton">
              <skeleton-loader :style="{ width: '90%', height: '0.85rem' }" />
              <skeleton-loader :style="{ width: '70%', height: '0.85rem' }" />
            </div>
          </div>
          <skeleton-loader
            class="tx-hash-action-skeleton"
            :style="{ width: '100%', height: '50px', borderRadius: '14px' }"
          />
        </section>

        <section class="tx-info-card card-bg">
          <div class="tx-section-title">
            <skeleton-loader :style="{ width: '130px', height: '0.85rem' }" />
          </div>
          <div class="tx-detail-rows">
            <div v-for="i in 3" :key="i" class="tx-detail-row">
              <div class="tx-detail-key">
                <skeleton-loader :style="{ width: '90px', height: '0.8rem' }" />
              </div>
              <div class="tx-detail-value tx-detail-value--skeleton">
                <skeleton-loader :style="{ width: '70px', height: '0.8rem' }" />
              </div>
            </div>
          </div>
        </section>

        <section class="tx-info-card card-bg">
          <div class="tx-tech-header">
            <skeleton-loader :style="{ width: '65%', height: '0.85rem' }" />
            <span class="tx-tech-arrow">+</span>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
import ArrowIcon from '~/assets/images/arrow.svg?inline'

// Structural placeholder for the hero transaction-detail layout — mirrors
// the shipped hero's own DOM shape (tx-swap-head/tx-metric-strip/
// tx-detail-rows/tx-lifecycle-list/rail cards) using the shared classes in
// _tx-detail.scss, so nothing shifts position once the real overview swaps
// in. Shown while the tx type is still unknown (before any *Overview
// computed can resolve), so it can't tailor itself to swap vs. send vs.
// bond etc. — it approximates the swap layout since that's the most common
// case, rather than serving a page's worth of an old-UI-only spinner.
export default {
  components: { ArrowIcon },
  data() {
    return {
      detailRowWidths: [
        { label: '70px', value: '160px' },
        { label: '55px', value: '110px' },
        { label: '50px', value: '90px' },
        { label: '45px', value: '220px' },
        { label: '60px', value: '140px' },
        { label: '65px', value: '190px' },
      ],
    }
  },
}
</script>

<style lang="scss" scoped>
// SkeletonLoader's own unscoped style gives every bar a blanket 5px margin
// (components/SkeletonLoader.vue), which is fine for ad hoc one-off use but
// stacks with this page's own precise gap/padding/margin rules, throwing
// off the vertical rhythm this component exists to match exactly. Zeroed
// here so every bar's spacing comes from the one real rule that would
// apply to it once real content lands — never from the bar itself. Scoped
// styles reach a directly-placed child component's root node in Vue 2, so
// this needs no ::v-deep.
.skeleton-container {
  margin: 0;
}

.tx-detail-title--skeleton {
  display: flex;
  flex-direction: column;
  gap: $space-8;
}

.tx-detail-value--skeleton {
  display: flex;
  justify-content: flex-end;
}

// .tx-hash-full is normally one div of wrapping text; faked here as two
// stacked bars for a wrapped-hash silhouette, so they need their own small
// gap standing in for a text wrap's line-height (the real div has none).
.tx-hash-full--skeleton {
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.tx-hash-action-skeleton {
  margin-top: $space-14;
}

.tx-lifecycle-dot--skeleton {
  background: var(--surface-3-color);
  border-color: var(--divider-color);
}
</style>
