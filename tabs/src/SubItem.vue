<template>
    <div class='item browser-style sub'>
        <input type="checkbox" v-bind:id="`input-${group.id}-${page.id}`" v-model="page.checked"/>
        <label v-bind:for="`input-${group.id}-${page.id}`">{{ page.title }}</label>
    </div>
</template>

<script>
export default {
  name: 'subitem',
  props: ['group', 'page'],
  watch: {
    'page.checked': function () {
        let checkedCount = this.group.pages.filter((p)=>p.checked).length;
        if (checkedCount === this.group.pages.length) {
            this.group.checked = true;
            this.group.halfChecked = false;
        } else if (checkedCount > 0) {
            this.group.checked = true;
            this.group.halfChecked = true;
        } else {
            this.group.checked = false;
            this.group.halfChecked = false;
        }
    }
  }
}
</script>

<style scoped>

.item {
    min-height: 40px;
    /*border-bottom: 1px solid #ddd;*/
    padding: 0px 8px;
    line-height: 40px;
    vertical-align: middle;
    margin-bottom: 0px;
    position: relative
}

.item.sub {
    margin-left: 40px;
}

.item.partial-selected label::before{
    opacity: 0.5;
}
</style>