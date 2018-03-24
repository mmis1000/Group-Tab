<template>
    <div v-bind:class="[
        'item', 
        'browser-style', 
        'sub',
        page.selected? 'overlayed': ''
    ]">
        <input type="checkbox" v-bind:id="`input-${group.id}-${page.id}`" v-model="page.checked"/>
        <label v-once v-bind:for="`input-${group.id}-${page.id}`">{{ page.title }}</label>
        <div class="action" @click="subAction">
            <i class="fas fa-external-link-alt"></i>
        </div>
        
        <div class='select-overlay' v-if="overlayed" @click="overlayAction">
            
        </div>
    </div>
</template>

<script>
export default {
  name: 'subitem',
  props: ['group', 'page', 'onchange', 'onaction', 'onoverlayaction', 'overlayed'],
  watch: {
    'page.checked': function () {
        let checkedCount = this.group.pages.filter((p)=>p.checked).length;
        this.group.checkedCount = checkedCount;
        
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
        
        if (this.onchange) {
            this.onchange(this.page, this.group)
        }
    }
  },
  methods: {
    subAction() {
        if (this.onaction) {
            this.onaction(this.page, this.group);
        }
    },
    overlayAction() {
        if (this.onoverlayaction) {
            this.onoverlayaction(this.page, this.group);
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
    margin-right: 0px;
    position: relative
}

.item.sub {
    margin-left: 40px;
}

.item label {
    display: inline-block;
    min-width: 100%;
    height: 100%;
    cursor: pointer;
}

.item.partial-selected label::before{
    opacity: 0.5;
}

.item .action {
    position: absolute;
    right: 0px;
    top: 0px;
    bottom: 0px;
    width: 48px;
    
    line-height: 0px;
    vertical-align: middle;
    text-align: center;
    cursor: pointer;
    
    transition: opacity .5s;
    opacity: 0;
    background: #eee;
}

.item:hover .action {
    opacity: 1;
}

.item .action * {
    vertical-align: middle;
}

.item.overlayed {
    background: #ccf !important;
}

.item .action:before {
    vertical-align: middle;
    display: inline-block;
    content: '　';
    height: 100%;
    width: 0px;
}

.item .select-overlay {
    width: 100%;
    left: 24px;
    right: 0px;
    top: 0px;
    bottom: 0px;
    position: absolute;
}

</style>