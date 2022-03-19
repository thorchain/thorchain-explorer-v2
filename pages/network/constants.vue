<template>
  <div class="constants-container">
    <stat-table :tableSettings="networkConstants" header="Network Constants"></stat-table>
  </div>
</template>

<script>
import StatTable from '~/components/StatTable.vue'
export default {
  components: { StatTable },
  data() {
    return {
      networkConst: [],
    }
  },
  mounted() {
    this.$api.getConstants().then(res => {
      this.networkConst = res.data;
    }).catch(e => {
      console.error(e);
    })
  },
  computed: {
    networkConstants: function() {
      return [
        [
          {
            name: 'Asgard Size',
            value: this.networkConst?.int_64_values?.AsgardSize
          }
        ],
        [
          {
            name: 'Bad Validator Rate',
            value: this.networkConst?.int_64_values?.BadValidatorRate
          },
          {
            name: 'Bad Validator Redline',
            value: this.networkConst?.int_64_values?.BadValidatorRedline
          }
        ],
        [
          {
            name: 'Blocks Per Year',
            value: this.networkConst?.int_64_values?.BlocksPerYear
          },
          {
            name: 'Churn Interval',
            value: this.networkConst?.int_64_values?.ChurnInterval
          }
        ]
      ]
    }
  }
}
</script>

<style>

</style>