<template>
  <div>

    <div v-if="!isRoot" v-bind:class="[
        'item', 
        'browser-style', 
        item.isFolder? 'folder': '' ,
        item.selected? 'overlayed': '',
        item.halfChecked? 'partial-selected': '', 
        item.data.type === 'separator'? 'separator': '',
        item.expanded? 'expanded': ''
      ]">
      <div v-if="item.isFolder" class='div expand-icon' @click="item.expanded = !item.expanded">
        <i class="fas fa-angle-right fa-2x"></i>
      </div>

      <input type="checkbox" v-bind:id="`input-${item.path}`" :checked="item.checked" @change="onChange" />

      <label v-bind:for="`input-${item.path}`">{{ item.data.type === 'separator' ? '' : item.text }} ({{item.total}})</label>

      <div v-if="!item.isFolder && item.data.type !== 'separator'" class="action" @click="subAction">
        <i class="fas fa-external-link-alt"></i>
      </div>

      <div class='select-overlay' v-if="overlayed" @click="overlayAction"></div>
    </div>

    <transition name="slide-v">
      <div v-bind:class="isRoot ? ['rootlist']: ['sublist']" v-show="item.expanded || isRoot" v-if="(item.enabled || isRoot) && Array.isArray(item.children) && item.children.length > 0">
        <item v-for="subItem in item.children" v-bind:item="subItem" v-bind:path="subItem.path" v-bind:parents="parents.concat([item])"
          v-bind:onaction="onaction" v-bind:onoverlayaction="onoverlayaction" v-bind:overlayed="overlayed" v-bind:isRoot="false"
          v-bind:key="subItem.path" />
      </div>
    </transition>
  </div>
</template>

<script>
  /*
      page : {
          text: String, text to display
          path: String, // unique id of this item, not necessary meaningful id
          checked: Boolean, // computed property for folder value of checkbox for item
          halfChecked: Boolean, // always false for item, true for folder with 0 < checkedCount < total
          selected: Boolean, // if this item got selected
          checkedCount: Number, // 0 or 1 for item, checked items count for folder
          total: Number, // 1 for item, items count for folder, at least 1, empty folder is treated as item
          isFolder: Boolean,
          children: Array,
          parent: any, // id of parent, null for root
          data: any, // the data meant for specific panel
          url: String, // url of given item (null for folder)
      }
  */

  export default {
    name: 'item',
    props: ['path', 'parents', 'item', 'onaction', 'onoverlayaction', 'overlayed', 'isRoot'],
    watch: {
      'item.expanded': function (val) {
        if (val) {
          this.item.enabled = true;
        }
      },
      'item.dirty': function (val) {
        if (val) {
          this.item.dirty = false;
          this.updateChecked(this.item.checked);
        }
      }
    },
    methods: {
      setCheckedRecursive(item, checked) {
        item.checked = checked;
        item.halfChecked = false;
        item.checkedCount = checked ? item.total : 0;

        if (item.isFolder) {
          for (let child of item.children) {
            this.setCheckedRecursive(child, checked);
          }
        }
      },
      onChange(e) {
        console.log('update checked', e.target.checked);
        const value = e.target.checked;
        this.updateChecked(value);
      },
      updateChecked(value) {
        const item = this.item;
        // update status for child
        this.setCheckedRecursive(item, value);

        // update status for parent

        let parents = this.parents.slice(0).reverse();

        for (let node of parents) {
          node.checkedCount = node.children.reduce((prev, curr) => {
            return prev + curr.checkedCount;
          }, 0);

          if (node.checkedCount === 0) {
            // console.log(JSON.parse(JSON.stringify(node)), false, false);
            node.checked = false;
            node.halfChecked = false;
          } else if (node.checkedCount > 0 && node.checkedCount < node.total) {
            // console.log(JSON.parse(JSON.stringify(node)), true, true);
            node.checked = true;
            node.halfChecked = true;
          } else if (node.checkedCount === node.total) {
            // console.log(JSON.parse(JSON.stringify(node)), true, false);
            node.checked = true;
            node.halfChecked = false;
          } else {
            throw new Error('how do you turn this on?');
          }
        }
        // console.log('here');
      },
      subAction() {
        if (this.onaction) {
          this.onaction(this.item, this.parents);
        }
      },
      overlayAction() {
        if (this.onoverlayaction) {
          this.onoverlayaction(this.item, this.parents);
        }
      },
    },
    mounted() {
      if (this.item.expanded) {
        this.item.enabled = true;
      }
      if (this.item.dirty) {
        console.log('pre dirty');
        this.item.dirty = false;
        this.updateChecked(this.item.checked);
      }
    }
  };
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

  .item.separator {
    background: rgba(255, 255, 255, 1);
    background: -moz-linear-gradient(top, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 1) 39%, rgba(0, 0, 0, 1) 40%, rgba(0, 0, 0, 1) 57%, rgba(255, 255, 255, 1) 58%, rgba(255, 255, 255, 1) 100%);
    background: -webkit-gradient(left top, left bottom, color-stop(0%, rgba(255, 255, 255, 1)), color-stop(39%, rgba(255, 255, 255, 1)), color-stop(40%, rgba(0, 0, 0, 1)), color-stop(57%, rgba(0, 0, 0, 1)), color-stop(58%, rgba(255, 255, 255, 1)), color-stop(100%, rgba(255, 255, 255, 1)));
    background: -webkit-linear-gradient(top, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 1) 39%, rgba(0, 0, 0, 1) 40%, rgba(0, 0, 0, 1) 57%, rgba(255, 255, 255, 1) 58%, rgba(255, 255, 255, 1) 100%);
    background: -o-linear-gradient(top, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 1) 39%, rgba(0, 0, 0, 1) 40%, rgba(0, 0, 0, 1) 57%, rgba(255, 255, 255, 1) 58%, rgba(255, 255, 255, 1) 100%);
    background: -ms-linear-gradient(top, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 1) 39%, rgba(0, 0, 0, 1) 40%, rgba(0, 0, 0, 1) 57%, rgba(255, 255, 255, 1) 58%, rgba(255, 255, 255, 1) 100%);
    background: linear-gradient(to bottom, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 1) 39%, rgba(0, 0, 0, 1) 40%, rgba(0, 0, 0, 1) 57%, rgba(255, 255, 255, 1) 58%, rgba(255, 255, 255, 1) 100%);
    min-height: 24px;
    line-height: 24px;
  }

  label {
    display: inline-block;
    min-width: 100%;
    height: 100%;
    cursor: pointer;
  }

  .item.folder>label {
    min-width: calc(100% - 40px);
  }

  .item.partial-selected>label::before {
    opacity: 0.5;
  }


  .expand-icon {
    height: 100%;
    width: 32px;
    text-align: center;
    vertical-align: middle;
    line-height: 40px;
    cursor: pointer;
    float: left;

    margin-left: -4px;
    margin-right: 4px;
    transition: all 1s;
  }

  .item.expanded>.expand-icon {
    transform: rotate(90deg)
  }

  .expand-icon i {
    vertical-align: middle;
  }


  .action {
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

  .item:hover>.action {
    opacity: 1;
  }

  .action * {
    vertical-align: middle;
  }

  .item.overlayed {
    background: #ccf !important;
  }

  .action:before {
    vertical-align: middle;
    display: inline-block;
    content: '　';
    height: 100%;
    width: 0px;
  }

  .select-overlay {
    width: 100%;
    left: 0px;
    right: 0px;
    top: 0px;
    bottom: 0px;
    position: absolute;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s;
  }

  .folder .select-overlay {
    left: 32px;
  }

  .select-overlay:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  .sublist {
    padding-left: 40px;
    margin-right: 0px;
    overflow: hidden;
  }

  .rootlist {
    padding-left: -8px;
    margin-right: 0px;
    overflow: hidden;
  }

  .slide-v-enter-active,
  .slide-v-leave-active {
    max-height: 1000px;
    transition: max-height 0.5s ease-in;
  }

  .slide-v-enter,
  .slide-v-leave-to
  /* .slide-h-leave-active below version 2.1.8 */

    {
    /*opacity: 0;*/
    max-height: 0;
  }
</style>