<template>
    <component :is="loading ? 'skeleton-loader': 'div'" :class="customClass">
        <slot></slot>
    </component>
</template>

<script>
export default {
    props: ['loading', 'customClass']
}
</script>

<style lang="scss">
    
</style>