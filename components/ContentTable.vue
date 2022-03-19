<template>
  <div class="table-wrapper">
    <div class="header">{{header}}
    </div>
    <div v-if="stats" class="table-stat">
      <dir v-for="(stat, idx) in stats" :key="idx">
        <div class="item">
          <div class="header">{{stat.name}}</div>
          <div class="value">{{stat.value}}</div>
        </div>
      </dir>
    </div>
    <div class="table">
      <table v-if="table">
        <thead>
          <tr align="left">
            <th v-for="(h, idx) in table.header" :key="idx">{{h}}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(t, idx) in table.content" :key="idx" @click="$emit('gotoNode', table.addresses[idx])">
            <td v-for="(item, i) in t" :key="idx+'t'+i">
              {{item}}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ContentTable',
  props: ['header', 'stats', 'table']
}
</script>

<style lang="scss" scoped>
.table-wrapper {
  display: flex;
  flex-direction: column;
  border-radius: .5rem;
  background-color: #191C1E;
  border: 1px solid #263238;

  .header {
    color: #e6e6e6;
    font-size: 1.5rem;
    padding: 1rem;
  }

  .table {
    overflow: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;

    thead tr th {
      padding: 1rem;
      color: #e6e6e6;
    }

    tbody tr {
      &:hover {
        background-color: #161819;  
      }

      td {
        cursor: pointer;
        padding: 1rem;
        color: #e6e6e6;
        border: 1px solid #263238;
        border-width: 1px 0 1px 0;
      }

      &:last-of-type td {
        border: none;
      }
    }
  }
}
</style>