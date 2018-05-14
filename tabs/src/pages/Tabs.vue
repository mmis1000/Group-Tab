<template>
  <div>
    <h1> Total {{tree.total}} {{ tree.checkedCount > 0 ? ' (' + tree.checkedCount + ' selected)': '' }}</h1>
    <item 
      v-bind:path="tree.path" 
      v-bind:item="tree" 
      v-bind:parents="[]" 
      v-bind:overlayed="multiSelecting" 
      v-bind:onoverlayaction="onItemSelect"
      v-bind:onaction="jumpToTab"
      v-bind:isRoot="true" />

    <transition name="slide-v">
      <div class="save-panel" v-if="tree.checkedCount > 0">
        <div class="item" @click="close">
          <i class="fas fa-times-circle fa-lg"></i>
          Close
        </div>
        <div class="item" @click="closeAndSave">
          <i class="fas fa-save fa-lg"></i>
          Save And Close
        </div>
        <div class="item" @click="save">
          <i class="fas fa-save fa-lg"></i>
          Save
        </div>
        <div class="item" @click="cancel">
          <i class="fas fa-times fa-lg" style="color: red;"></i>
          Cancel
        </div>
      </div>
    </transition>


    <div class="edit-panel">
      <transition name="slide-h">
        <div v-show="!multiSelecting" class="item" @click="selectAll">
          <i class="fas fa-hand-pointer fa-lg"></i>
          Select all
        </div>
      </transition>
      <transition name="slide-h">
        <div v-show="!multiSelecting" class="item" @click="cancel">
          <i class="far fa-hand-pointer fa-lg"></i>
          Unselect all
        </div>
      </transition>
      <transition name="slide-h">
        <div v-show="!multiSelecting" @click="multiSelecting = !multiSelecting" class="item">
          <i class="fas fa-boxes fa-lg"></i>
          Multi select
        </div>
      </transition>

      <transition name="slide-h">
        <div v-show="multiSelecting" class="item" @click="toggleSelectionMode">
          <img v-bind:src="`/icons/${selectMode}.svg`" style="vertical-align: middle; height: 18px;" /> {{selectMode}} mode
        </div>
      </transition>
      <transition name="slide-h">
        <div v-show="multiSelecting" @click="multiSelecting = !multiSelecting" class="item">
          <i class="fas fa-boxes fa-lg"></i>
          Stop multi select
        </div>
      </transition>
    </div>
    <div style="position: fixed; left:0; right:0; top:0; bottom:0; background: rgba(127, 127, 127, 0.7)" v-show="loading">Loading...</div>
  </div>
</template>

<script>
  import mapToTree from '../utils/mapToTree.js';
  const mapToData = mapToTree();

  /** 
   * @type {mapToTree.TreeNode}
  */
 var a;

  export default {
    name: 'tabs',
    data() {
      return {
        list: this.$store.state.tabs.list,
        tree: mapToData(this.$store.state.tabs.map, this.$store.state.tabs.rootNodeId),
        multiSelecting: false,
        selectMode: 'auto',
        selectModes: ['auto', 'or', 'not', 'xor'],
        firstSelect: null,
        secondSelect: null,
      };
    },
    computed: {
      loading() {
        return this.$store.state.tabs.loading;
      },
    },
    watch: {
      list() {
        this.tree = mapToData(this.$store.state.tabs.map, this.$store.state.tabs.rootNodeId);
      }
    },
    methods: {
      selectAll() {
        this.tree.checked = true;
        this.tree.dirty = true;
      },
      cancel() {
        this.tree.checked = false;
        this.tree.dirty = true;
      },
      onShiftDown(ev) {
        this.onShiftToggle('down', ev);
      },
      onShiftUp(ev) {
        this.onShiftToggle('up', ev);
      },
      onShiftToggle(type, ev) {
        if (ev.key !== "Shift") return;
        if (type === 'down') {
          this.multiSelecting = true;
        } else if (type === 'up') {
          this.multiSelecting = false;
        }
      },
      toggleSelectionMode() {
        var current = this.selectMode;
        var index = this.selectModes.indexOf(current);
        var next = this.selectModes[(index + 1) % this.selectModes.length];
        this.selectMode = next;
      },
      onItemSelect(item, parents) {
        console.log(item);

        /** 
         * @param {Array} chain
         * @param {number[]} index
         * @returns {number[]}
        */
        const findIndex = (chain, index = [])=>{
          if (chain.length > 1) {
            return findIndex(chain.slice(1), index.concat([chain[0].children.indexOf(chain[1])]));
          } else {
            return index;
          }
        };

        /**
         * @param {number[]} index0
         * @param {number[]} index1
         * @param {boolean} alsoEqual
         * @returns {boolean}
         */
        const isBiggerThan = (index0, index1, alsoEqual = false)=>{
          if (index0[0] != null && index1[0] != null) {
            /*
             * - index0 [0]
             * - index1 [1]
             * or
             * - index0    [0]
             *   - index1  [0], 0
             * or
             * - index1    [0]
             *   - index0  [0], 0
             * or
             * - index0, index1 [0]
             */
            if (index0[0] === index1 [0]) {
              // one of them is child of another or they are just the same
              return isBiggerThan(index0.slice(1), index1.slice(1), alsoEqual);
            } else {
              // they have diffrent root
              return index0[0] > index1[0];
            }
          } else if (index0[0] != null){
            /* 
             * index0 is child of index1
             * - index1    0  [ ]
             *   - index0  0, [0]
             */
            return true;
          } else if (index1[0] != null) {
            /* 
             * index1 is child of index0
             * - index0    0  [ ]
             *   - index1  0, [0]
             */
            return false;
          } else {
            /* 
             * they are the same
             * - index0, index1 0, [ ]
             */
            return alsoEqual;
          }
        };

        /** 
         * @param {any} tree
         * @param {number[]} min
         * @param {number[]any} max
         * @param {number[]?} currentIndex
         * @param {Array?} results
         * @returns {Array}
         */
        const filterTree = (tree, min, max, currentIndex = [], results = [], parents = [])=>{
          if (
            isBiggerThan(currentIndex, min, true) &&
            isBiggerThan(max, currentIndex, true) &&
            (!tree.isFolder || tree.children.length === 0)
          ) {
            console.log('found', min, currentIndex, max, tree);
            results.push({item: tree, parents});
          }

          tree.children.forEach((leaf, index)=>{
            filterTree(leaf, min, max, currentIndex.concat([index]), results, parents.concat([tree]));
          });

          return results;
        };

        if (item.isFolder) {
          return;
        } else {
          if (!this.firstSelect) {
            item.selected = true;
            this.firstSelect = {item, parents};
          } else {
            this.secondSelect = {item, parents};

            let firstIndex = findIndex(this.firstSelect.parents.concat([this.firstSelect.item]));
            let secondIndex = findIndex(this.secondSelect.parents.concat([this.secondSelect.item]));

            if (isBiggerThan(firstIndex, secondIndex)) {
              [firstIndex, secondIndex] = [secondIndex, firstIndex];
            }

            var found = filterTree(this.tree, firstIndex, secondIndex);

            let newStatusMap = ({
              'auto': !this.firstSelect.item.checked,
              'not': false,
              'or': true
            });

            found.forEach(({item: leaf, parents})=>{
              if (this.selectMode === 'auto' || this.selectMode === 'not' || this.selectMode === 'or') {
                let newStatus = newStatusMap[this.selectMode];

                leaf.checked = newStatus;
              } else if (this.selectMode === 'xor') {
                leaf.checked = !leaf.checked;
              } else {
                throw new Error('what is this mode? ' + this.selectMode);
              }

              console.log(item, parents);

              parents.forEach((n)=>n.enabled = true);
              leaf.enabled = true;

              console.log(JSON.parse(JSON.stringify([item, parents])));
              
              leaf.dirty = true;
            });

            this.firstSelect.item.selected = false;
            this.firstSelect = null;

            // look up index of the first and second item
          }
        }
      },
      findChecked(root, res = []) {
        if (!root.isFolder) {
          if (root.checked) {
            res.push(root);
          }
        } else {
          if (root.children.length === 0 && root.checked) {
            // empty folder can be checked
            res.push(root);
          } else if (root.checkedCount > 0) {
            if (root.checkedCount === root.total) {
              // full directory will be checked
              res.push(root);
            }

            // else wise push the children
            root.children.forEach((child) => {
              this.findChecked(child, res);
            });
          }
        }

        return res;
      },
      close() {
        if (!confirm('really want to close these tabs?')) {
          return;
        }

        // find selected nodes from tree

        var selectedTabs = this.findChecked(this.tree).map((i) => this.$store.state.tabs.map.get(i.path));
        console.log(JSON.parse(JSON.stringify(selectedTabs)));

        this.$store.dispatch('tabs/remove', selectedTabs);
      },
      closeAndSave() {
        if (!confirm('really want to save and close these tabs?')) {
          return;
        }

        // find selected nodes from tree

        var selectedTabs = this.findChecked(this.tree).map((i) => this.$store.state.tabs.map.get(i.path));
        console.log(JSON.parse(JSON.stringify(selectedTabs)));

        this.$store.dispatch('history/pushStack', {
          path: '/bookmarks',
          mode: 'select',
          redirectTo: '/tabs',
          text: 'Select where to add bookmarks',
          validate: (bookmark) => {
            if (!bookmark.isFolder) {
              alert("You can't add the bookmarks onto a bookmark!");
              return false;
            } else {
              return true;
            }
          },
          action: (bookmark) => {
            let tabs = this.$store.state.history.currentFrame.info;

            let grouped = confirm('would you like to group them into a folder?');
            let folderName;

            if (grouped) {
              folderName = prompt('enter the folder name', 'A New Fowder');
            }

            this.$store.dispatch('tabs/removeAndAddToBookmarks', {
              tabs,
              target: bookmark,
              isGrouped: grouped,
              name: folderName,
            });

            this.$store.dispatch('history/drop');

            this.$router.push({
              path: '/tabs'
            });
          },
          info: selectedTabs,
        });

        this.$router.push({
          path: '/bookmarks'
        });
      },
      save() {
        if (!confirm('really want to save these tabs?')) {
          return;
        }

        // find selected nodes from tree

        var selectedTabs = this.findChecked(this.tree).map((i) => this.$store.state.tabs.map.get(i.path));
        console.log(JSON.parse(JSON.stringify(selectedTabs)));

        this.$store.dispatch('history/pushStack', {
          path: '/bookmarks',
          mode: 'select',
          redirectTo: '/tabs',
          text: 'Select where to add bookmarks',
          validate: (bookmark) => {
            if (!bookmark.isFolder) {
              alert("You can't add the bookmarks onto a bookmark!");
              return false;
            } else {
              return true;
            }
          },
          action: (bookmark) => {
            let tabs = this.$store.state.history.currentFrame.info;

            let grouped = confirm('would you like to group them into a folder?');
            let folderName;

            if (grouped) {
              folderName = prompt('enter the folder name', 'A New Fowder') || 'A New Fowder';
            }

            this.$store.dispatch('tabs/addToBookmarks', {
              tabs,
              target: bookmark,
              isGrouped: grouped,
              name: folderName,
            });

            this.$store.dispatch('history/drop');

            this.$router.push({
              path: '/tabs'
            });
          },
          info: selectedTabs,
        });

        this.$router.push({
          path: '/bookmarks'
        });
      },
      jumpToTab(item, parents) {
        if (item.isFolder) {
          return;
        }

        let original = this.$store.state.tabs.map.get(item.path);

        this.$store.dispatch('tabs/jumpTo', original);
      }
    },
    async mounted() {
      this.onShiftDown = this.onShiftDown.bind(this);
      this.onShiftUp = this.onShiftUp.bind(this);
      document.addEventListener('keydown', this.onShiftDown);
      document.addEventListener('keyup', this.onShiftUp);

      try {
        await this.$store.dispatch('tabs/load');
      } catch (err) {
        console.log(err);
      }
    },
    beforeDestroy: function () {
      document.removeEventListener('keydown', this.onShiftDown);
      document.removeEventListener('keyup', this.onShiftUp);
    },
  };
</script>

<style scoped>
  h1 {
    padding-left: 8px;
    margin-top: 0px;
  }

  .save-panel {
    position: fixed;
    bottom: 0px;
    left: 0px;
    width: 240px;
    padding-bottom: 34px;
  }

  .save-panel .item {
    height: 48px;
    line-height: 48px;
    margin-left: 34px;
    font-size: 1.25em;
    vertical-align: middle;
    border-radius: 4px;

    cursor: pointer;
  }

  .save-panel .item:hover {
    background: #ccc;
  }

  .save-panel .item i {
    vertical-align: middle;
    margin-left: 4px;
    margin-right: 4px;
    width: 32px;
    text-align: center;
  }

  .edit-panel {
    position: fixed;
    right: 0px;
    top: 0px;
    /*left: 268px;*/
    left: 0px;
    padding: 16px;
    text-align: right;

    box-sizing: border-box;
    height: 70px;
    background: #fafafc;
  }

  .edit-panel .item {
    vertical-align: middle;
    display: inline-block;
    font-size: 1.25em;
    /*height: 2em;*/
    line-height: 2em;
    padding: 0.25em 1em;
    border-radius: 4px;
    border: 1px solid #ccc;

    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
  }

  .edit-panel .item:hover {
    background: #ccc;
  }

  .edit-panel .item * {
    vertical-align: middle;
  }


  .search-box {
    vertical-align: middle;
    display: inline-block;
    /*position: fixed;
    top:0px;
    height: 80px;
    left:268px;
    right: 0px;*/
    background: #fafafc;

    /*max-width: 664px;
    line-height: 80px;*/
    text-align: end;
    margin: 5px;
  }

  .search-box input {
    font-size: 1.25em !important;
    padding: 2px !important;
    box-sizing: content-box;
    width: 220px;
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

  .slide-h-enter-active,
  .slide-h-leave-active {
    max-width: 300px;
    transition: max-width 0.5s ease-in, opacity 0.5s ease-in;
  }

  .slide-h-enter,
  .slide-h-leave-to
  /* .slide-h-leave-active below version 2.1.8 */

    {
    opacity: 0;
    max-width: 0;
  }

  .loading-overlay {
    position: fixed;
    left: 0px;
    right: 0px;
    top: 0px;
    bottom: 0px;
    background: rgba(127, 127, 127, 0.5);
  }

  .loading-overlay:before {
    content: "Now Loading....";
  }
</style>