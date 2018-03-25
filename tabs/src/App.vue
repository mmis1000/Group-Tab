<template>
  <div>
    <div class="sidebar">
        <div class="item" @click="currentTab = 'current'">
            <i class="fas fa-book fa-2x"></i>
            Current Tabs
        </div>
        <div class="item" @click="currentTab = 'saved'">
            <i class="fas fa-save fa-2x"></i>
            Saved Tabs
        </div>
        
        <transition name="slide-v">
            <div class="bottom" v-if="panel[this.currentTab].showSave">
                <transition name="slide-v">
                    <div class="item" @click="saveTabs" v-if="currentTab === 'current'">
                        <i class="fas fa-save fa-lg"></i>
                        Save
                    </div>
                </transition>
                <transition name="slide-v">
                    <div class="item" @click="saveAndCloseTabs" v-if="currentTab ==='current'">
                        <i class="fas fa-save fa-lg"></i>
                        Save and close
                    </div>
                </transition>
                <transition name="slide-v">
                    <div class="item" @click="closeTabs" v-if="currentTab === 'current'">
                        <i class="fas fa-times-circle fa-lg"></i>
                        Close
                    </div>
                </transition>
                <transition name="slide-v">
                    <div class="item" @click="deleteSaved" v-if="currentTab === 'saved'">
                        <i class="fas fa-times-circle fa-lg"></i>
                        Delete
                    </div>
                </transition>
                <div class="item" @click="cancel">
                    <i class="fas fa-times fa-lg" style="color: red;"></i>
                    Cancel
                </div>
            </div>
        </transition>
    </div>
    
    
    <div class="main">
        <h1 class='browser-style'>
            <transition name="slide-h">
                 <span v-if="currentTab === 'current'" style="display:inline-block; overflow: hidden; white-space: nowrap;">
                    Your current tabs {{ tabs.length }}
                 </span>
            </transition>
            <transition name="slide-h">
                 <span v-if="currentTab === 'saved'" style="display:inline-block; overflow: hidden; white-space: nowrap;">
                    Your saved tabs
                 </span>
            </transition>
            <span v-if="panel[currentTab].selectTabCount > 0" style="display:inline-block; overflow: hidden; white-space: nowrap;">
                ({{panel[currentTab].selectTabCount}} selected)
            </span>
        </h1>
        <!--<pre id="test"></pre>-->
        <div v-for="group in panel[this.currentTab].groups" :key="group.id + '.' + group.keyword" class='browser-style'>
            <div v-bind:class="[
                'item', 
                'head', 
                'browser-style', 
                group.halfChecked? 'partial-selected': '', 
                group.show? 'expanded': '' , 
                group.overlay? 'overlayed': '' , 
                group.selected? 'selected': '' 
            ]">
                <div v-once class='div expand-icon' @click="group.show = !group.show">
                    <i class="fas fa-angle-right fa-2x"></i>
                </div>
                
                <input 
                    type="checkbox" 
                    v-bind:id="`input-${group.id}`" 
                    v-model:checked="group.checked" 
                    @change="setGroupChecked.call(this, group)"
                />
                <label v-bind:for="`input-${group.id}`">{{ group.keyword }} ({{ group.pages.length }})</label>
                
                <div class='select-overlay'></div>
            </div>
            
            <transition name="slide-v">
                <div v-if="group.show" class='browser-style' style="overflow: hidden">
                    <subitem 
                        v-for="page in group.pages" 
                        v-bind:page="page" 
                        v-bind:group="group"
                        v-bind:overlayed="panel[currentTab].multiSelecting"
                        v-bind:onchange="onPageChange.bind(this)"
                        v-bind:onaction="onPageAction.bind(this)"
                        v-bind:onoverlayaction="onPageOverlayAction.bind(this)"
                    />
                </div>
            </transition>
        </div>
    </div>
    
    <div class="edit-panel">
        <transition name="slide-h">
            <div v-show="!panel[currentTab].multiSelecting" class="item" @click="selectAll">
                <i class="fas fa-hand-pointer fa-lg"></i>
                Select all
            </div>
        </transition>
        <transition name="slide-h">
            <div v-show="!panel[currentTab].multiSelecting" class="item" @click="cancel">
                <i class="far fa-hand-pointer fa-lg"></i>
                Unselect all
            </div>
        </transition>
        <transition name="slide-h">
            <div v-show="!panel[currentTab].multiSelecting" @click="panel[currentTab].multiSelecting = !panel[currentTab].multiSelecting" class="item">
                <i class="fas fa-boxes fa-lg"></i>
                Multi select
            </div>
        </transition>
        
        <transition name="slide-h">
            <div v-show="panel[currentTab].multiSelecting" class="item" @click="toggleSelectionMode">
                <img v-bind:src="`/icons/${panel[currentTab].selectMode}.svg`" style="vertical-align: middle; height: 18px;"/>
                {{panel[currentTab].selectMode}} mode
            </div>
        </transition>
        <transition name="slide-h">
            <div v-show="panel[currentTab].multiSelecting"  @click="panel[currentTab].multiSelecting = !panel[currentTab].multiSelecting" class="item">
                <i class="fas fa-boxes fa-lg"></i>
                Stop multi select
            </div>
        </transition>
        <!--
        <div class="search-box browser-style">
            <input type="text" id="search" placeholder="search for tabs">
            <label for="search"></label>
        </div>
        -->
        
    </div>
    
    <div class="loading-overlay" v-if="loading">
    </div>
  </div>
</template>

<script>
let SubItem = require('./SubItem.vue')
console.log(SubItem);

export default {
  name: 'app',
  data() {
    return {
      loading: true,
      keywordCache: new LRUCache(-1, false, new LRUCache.LocalStorageCacheStorage()),
      pages: [],
      id: 0,
      tabs: [],
      groups: [],
      showSave: false,
      selectTabCount: 0,
      currentTab: 'current',
      selectModes: ['auto', 'or', 'not', 'xor'],
      panel: {
        'current': {
          multiSelecting: false,
          groups: [],
          selectTabCount: 0,
          showSave: false,
          selectMode: 'auto'
        },
        'saved': {
          multiSelecting: false,
          groups: [],
          selectTabCount: 0,
          showSave: false,
          selectMode: 'auto'
        }
      }
    }
  },
  methods: {
    update() {
        let vm = this;
        let data = this.panel.current;
        
        vm.loading = true;
        
        vm.pages = [];
        browser.tabs.query({}).then((tabs)=>{        
            tabs.forEach((t)=>{
                if (t.title) {
                    if (vm.keywordCache.getItem(t.title.toLowerCase())) {
                        vm.pages.push(Promise.resolve({
                            keywords: vm.keywordCache.getItem(t.title.toLowerCase()),
                            title: t.title,
                            url: t.url,
                            tab: t
                        }))
                    } else {
                        vm.pages.push(cut(t.title.toLowerCase()).then((res)=>{
                            res = res.filter((i)=> !/^[\u0000-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E]*$/.test(i));
                            
                            vm.keywordCache.setItem(
                                t.title.toLowerCase(), 
                                res
                            );
                            
                            console.log(res);
                            
                            return {
                                keywords: res,
                                title: t.title,
                                url: t.url,
                                tab: t
                            };
                        }));
                    }
                }
            })
            
            Promise.all(vm.pages).then((pages)=>{
                var keywords = pages.reduce((prev, curr)=>{
                    curr.keywords.forEach((k)=>{
                        if (prev.indexOf(k) < 0) {
                            prev.push(k)
                        }
                    })
                    
                    return prev;
                }, [])
                
                console.log(keywords);
                
                let sorted = keywords.map((w)=>{
                    return {
                        id: vm.id++,
                        keyword: w,
                        checked: false,
                        halfChecked: false,
                        checkedCount: 0,
                        show: false,
                        pages: pages.filter((page)=>page.keywords.indexOf(w) >= 0).map((o)=>{
                            o.checked = false;
                            o.id = vm.id++;
                            o.selected = false;
                            // force a surface  clone
                            return Object.assign({}, o);
                        })
                    }
                })
                .sort((i, j)=>j.pages.length - i.pages.length)
                .filter((i)=>i.pages.length > 1)
                
                console.log(`groups has > 1 item: ${sorted.length}`);
                console.log(sorted)
                
                var ungroupableItems = {
                    id: vm.id++,
                    keyword: '<Ungroupable Pages>',
                    checked: false,
                    halfChecked: false,
                    checkedCount: 0,
                    show: false,
                    pages: pages.filter(
                        (currentPage)=>{
                            var exist = sorted.reduce((prev, group)=>{
                                return prev || group.pages.reduce((prev, page)=>{
                                    return prev || (currentPage.tab === page.tab)
                                }, false)
                            }, false)
                            return !exist;
                        }
                    ).map((o)=>{
                        o.checked = false;
                        o.id = vm.id++;
                        // force a surface  clone
                        return Object.assign({}, o);
                    })
                };
                
                sorted.push(ungroupableItems)
                
                vm.tabs= tabs;
                data.groups= sorted;
                data.showSave = false;
                data.selectTabCount = 0;
                data.multiSelecting = false;
                
                vm.loading = false;
            })
        });
    },
    setGroupChecked(group, checked=null) {
        if (checked == null) {
            checked = group.checked
        }
        
        group.checked = checked;
        group.halfChecked = false;
        group.checkedCount = checked ? group.pages.length : 0;
        group.pages.forEach((p)=>p.checked = checked)
        
        this.panel[this.currentTab].showSave = this.panel[this.currentTab].groups.filter((i)=>i.checkedCount > 0).length > 0;
        
        this.updateCount()
    },
    onPageChange(page, group) {
        if (group.checkedCount > 0) {
            this.panel[this.currentTab].showSave = true;
        } else {
            this.panel[this.currentTab].showSave = this.panel[this.currentTab].groups.filter((i)=>i.checkedCount > 0).length > 0;
        }
        
        this.updateCount()
    },
    onPageOverlayAction(currentPage, currentGroup) {
        // check if anyone ever being selected ?
        var groups = this.panel[this.currentTab].groups;
        
        var selectPage = null;
        var selectGroupIndex = -1;
        var selectPageIndex = -1;
        
        var currentGroupIndex = -1;
        var currentPageIndex = -1;
        
        groups.forEach((group, groupIndex)=>{
            group.pages.forEach((page, pageIndex)=>{
                if (currentPage === page) {
                    currentGroupIndex = groupIndex;
                    currentPageIndex = pageIndex;
                }
                
                if (page.selected) {
                    selectPage = page;
                    selectGroupIndex = groupIndex;
                    selectPageIndex = pageIndex;
                }
            })
        })
        
        if (selectPageIndex === -1) {
            // select the first page
            currentPage.selected = !currentPage.selected;
        } else if (/*selectGroupIndex !== currentGroupIndex || selectPageIndex !== currentPageIndex*/ true) {
            // select second page
            selectPage.selected = false;
            currentPage.selected = false;
            
            let old_checked = selectPage.checked;
            
            // iterate through the index to select pages
            
            if (selectGroupIndex > currentGroupIndex || (selectGroupIndex === currentGroupIndex && selectPageIndex > currentPageIndex)) {
                // swap the order;
                [selectGroupIndex, currentGroupIndex] = [currentGroupIndex, selectGroupIndex];
                [selectPageIndex, currentPageIndex] = [currentPageIndex, selectPageIndex];
            }
            
            for (let g = selectGroupIndex; g <= currentGroupIndex; g++) {
                let start, end;
                if (g === selectGroupIndex) {
                    start = selectPageIndex;
                } else {
                    start = 0;
                }
                
                if (g === currentGroupIndex) {
                    end = currentPageIndex;
                } else {
                    end = groups[g].pages.length - 1;
                }
                
                for (let p = start; p <= end; p++) {
                    // groups[g].pages[p].checked = !groups[g].pages[p].checked
                    switch (this.panel[this.currentTab].selectMode) {
                        case 'auto':
                            if (old_checked) {
                                groups[g].pages[p].checked = false
                            } else {
                                groups[g].pages[p].checked = true
                            }
                            break;
                        case 'or':
                            groups[g].pages[p].checked = true;
                            break;
                        case 'not':
                            groups[g].pages[p].checked = false;
                            break;
                        case 'xor':
                            groups[g].pages[p].checked = !groups[g].pages[p].checked;
                            break;
                        default:
                            throw new Error('how do you arrive here?')
                    }
                }
            }
        } else if (selectGroupIndex === currentGroupIndex && selectPageIndex === currentPageIndex) {
            // select the already selected page
            currentPage.selected = !currentPage.selected;
        } else {
            console.error('wtf? should this even possible to be happened?')
        }
        
    },
    updateCount() {
        this.panel[this.currentTab].selectTabCount = this.panel[this.currentTab].groups.reduce((prev, curr)=>prev + curr.checkedCount, 0)
    },
    closeTabs() {
        if (!confirm('really want to close and save these tabs?')) {
            return
        }
        this._closeTabs()
    },
    _closeTabs() {
        let flatten = (arr)=>{
            if (arr.length === 0) {
                return []
            }
            return [].concat.apply([], arr);
        }
        
        var tabs = flatten(this.panel.current.groups.map((group)=>{
            return group.pages.filter((p)=>p.checked)
        }));
        
        var m = new Map();
        
        // dedup
        tabs = tabs.reduce((prev, curr)=>{
            if (!m.has(curr.tab)) {
                m.set(curr.tab, true)
                prev.push(curr)
            }
            
            return prev;
        }, [])
        
        Promise.all(tabs.map((tab)=>{
            if (tab.tab.id !== browser.tabs.TAB_ID_NONE) {
                return browser.tabs.remove(tab.tab.id)
            } else {
                return Promise.resolve(true);
            }
        }))
        .then(()=>{
            this.update();
        })
        .catch((err)=>{
            console.error('error during close tabs')
            console.error(err)
            this.update();
        })
        
    },
    saveTabs() {
        this._saveTabs();
    },
    _saveTabs(noDelect = false) {
        let flatten = (arr)=>{
            if (arr.length === 0) {
                return []
            }
            return [].concat.apply([], arr);
        }
        
        let keywordMap = new Map();
        let keywords = [];
     
        var tabs = flatten(this.panel.current.groups.map((group)=>{
            let filtered = group.pages.filter((p)=>p.checked);
            
            if (filtered.length > 0) {
                if (!keywordMap.has(group.keyword)) {
                    keywordMap.set(group.keyword, true);
                    keywords.push(group.keyword)
                }
            }
            
            return group.pages.filter((p)=>p.checked)
        }));
        
        
        
        var m = new Map();
        // dedup
        tabs = tabs.reduce((prev, curr)=>{
            if (!m.has(curr.tab)) {
                m.set(curr.tab, true)
                prev.push(curr)
            }
            
            return prev;
        }, [])
        
        var name = prompt('what is the group name?', keywords.join(', '))
        
        if (!name) {
            return;
        }
        
        var group = {
            id: this.id++,
            keyword: name,
            checked: false,
            halfChecked: false,
            checkedCount: 0,
            show: false,
            pages: tabs.map((tab)=>{
                console.log(tab);
                return {
                    keywords: tab.keywords,
                    title: tab.title,
                    url: tab.url,
                    id: this.id++,
                    selected: false,
                    checked: false
                }
            })
        }
        
        this.panel.saved.groups.push(group)
        
        if (!noDelect) {
            this.panel.current.groups.forEach((g)=>{
                this.setGroupChecked(g, false);
            })
        }
        
        console.log(this.panel.saved.groups)
        
        this.saveTabToStorage()
    },
    saveAndCloseTabs() {
        if (!confirm('really want to close and save these tabs?')) {
            return
        }
        this._saveTabs(true);
        this._closeTabs();  
    },
    deleteSaved() {
        if (!confirm('really want to delete these items?')) {
            return
        }
    
        let flatten = (arr)=>{
            if (arr.length === 0) {
                return []
            }
            return [].concat.apply([], arr);
        }
        
        var tabs = flatten(this.panel.saved.groups.map((group)=>{
            return group.pages.filter((p)=>p.checked)
        }));
        
        console.log('tabs to remove', tabs)
        
        let panel = this.panel.saved;
        
        panel.groups.forEach((g)=>{
            this.setGroupChecked(g, false);
        })
        
        for (let i = panel.groups.length - 1; i >= 0; i--) {
            let group = panel.groups[i];
            for (let j = group.pages.length - 1; j >= 0; j--) {
                let page = group.pages[j];
                if (tabs.filter((tab)=>{
                    // console.log(tab.id, page.id)
                    return tab.id === page.id
                }).length > 0) {
                    // console.log('remove page', page)
                    group.pages.splice(j, 1);
                } else {
                    // console.log('not going to remove page', page)
                }
            }
            
            if (group.pages.length === 0) {
                panel.groups.splice(i, 1);
            }
        }
        
        this.saveTabToStorage()
    },
    cancel() {
        this.panel[this.currentTab].groups.forEach((g)=>{
            this.setGroupChecked(g, false);
        })
    },
    saveTabToStorage() {
        var mapped = this.panel.saved.groups.map((group)=>{
            return {
            　  keyword: group.keyword,
                pages: group.pages.map((page)=>{
                    return {
                        title: page.title,
                        url: page.url,
                        keywords: page.keywords
                    }
                })
            }
        })
        
        browser.storage.local.set({
            savedPages: mapped
        })
    },
    loadTabFromStorage() {
        
        browser.storage.local.get("savedPages")
        .then((data)=>{
            var savedPages = data.savedPages;
            if (!savedPages) return;
            
            var mapped = savedPages.map((group)=>{
                return {
                    id: this.id++,
                    
                    checked: false,
                    halfChecked: false,
                    checkedCount: 0,
                    show: false,
                    
                　  keyword: group.keyword,
                    pages: group.pages.map((page)=>{
                        return {
                            checked: false,
                            title: page.title,
                            id: this.id++,
                            url: page.url,
                            keywords: page.keywords
                        }
                    })
                }
            })
            
            this.panel.saved.groups = mapped;
        });
    },
    selectAll() {
        this.panel[this.currentTab].groups.forEach((g)=>{
            this.setGroupChecked(g, true);
        })
    },
    onPageAction(page, group) {
        console.log(JSON.stringify(page))
        if (this.currentTab === "current") {
            browser.tabs.update(
                page.tab.id,
                {
                    active: true
                }
            )
            
            browser.windows.update(
                page.tab.windowId,
                {
                    focused: true
                }
            )
            
        } else {
            browser.tabs.create({
                url: page.url
            })
        }
    },
    onShiftDown(ev) { this.onShiftToggle('down', ev) },
    onShiftUp(ev) { this.onShiftToggle('up', ev) },
    onShiftToggle(type, ev) {
        if (ev.key !== "Shift") return
        if (type === 'down') {
            this.panel[this.currentTab].multiSelecting = true;
        } else if (type === 'up') {
            this.panel[this.currentTab].multiSelecting = false;
        }
    },
    toggleSelectionMode() {
        var current = this.panel[this.currentTab].selectMode;
        var index = this.selectModes.indexOf(current);
        var next = this.selectModes[(index + 1) % this.selectModes.length];
        this.panel[this.currentTab].selectMode = next;
    }
  },
  
  computed: {
    allMultiSelectMode() {
        // it's only required to reference those properties
        this.panel.saved.multiSelecting;
        this.panel.current.multiSelecting;
        // and then return a different value every time
        return Date.now() // or performance.now()

        // object literals also work but we don't need that overhead
        // return {}
        // return []
    }
  },
  watch: {
    currentTab() {
        location.hash = this.currentTab;
    },
    allMultiSelectMode() {
        if (!this.panel[this.currentTab].multiSelecting) {
            
            this.panel.current.groups.forEach((g)=>{
                g.pages.forEach((p)=> {
                    p.selected = false;
                })
            })
        }
    }
  },
  mounted() {
    // `this` points to the vm instance
    setTimeout(()=>{
        this.update();
        this.loadTabFromStorage()
        
        let hash = location.hash.slice(1);
        if (hash === 'saved' || hash === 'current') {
            this.currentTab = hash;
        }
    })
    
    this.onShiftDown = this.onShiftDown.bind(this)
    this.onShiftUp = this.onShiftUp.bind(this)
    document.addEventListener('keydown', this.onShiftDown)
    document.addEventListener('keyup', this.onShiftUp)
  },
  beforeDestroy: function () {
    document.removeEventListener('keydown', this.onShiftDown)
    document.removeEventListener('keyup', this.onShiftUp)
  },
  components: {
    'subitem': SubItem
  }
}
</script>

<style scoped>
.sidebar {
    width: 240px;
    position: fixed;
    left:0px;
    top:0px;
    bottom:0px;
    
    padding-top: 70px;
}


.sidebar .item {
    height: 48px;
    line-height: 48px;
    margin-left: 34px;
    font-size: 1.25em;
    vertical-align: middle;
    border-radius: 4px;
    
    cursor: pointer;
}

.sidebar .item:hover {
    background: #ccc;
}

.sidebar .item i {
    vertical-align: middle;
    margin-left: 4px;
    margin-right: 4px;
    width: 32px;
    text-align: center;
}

.sidebar .bottom {
    position: absolute;
    bottom: 0px;
    left: 0px;
    width: 100%;
    padding-bottom: 34px;
}


.main {
    margin-left: 268px;
    padding-top: 80px;
    box-sizing: border-box;
    /*overflow: auto;*/
    /*max-width: 664px;*/
}

.main h1 {
    padding-left: 8px;
    margin-top: 0px;
}

.main .item:hover {
    background: #ccc;
}

.main .item {
    min-height: 40px;
    /*border-bottom: 1px solid #ddd;*/
    padding: 0px 8px;
    line-height: 40px;
    vertical-align: middle;
    margin-bottom: 0px;
    position: relative
}

.main .item label {
    display: inline-block;
    height: 100%;
    min-width: calc(100% - 40px);
    cursor: pointer;
}

.main .item.sub {
    margin-left: 40px;
}

.main .item.partial-selected label::before{
    opacity: 0.5;
}

.main .item.expanded .expand-icon {
    transform: rotate(90deg)
}

.main .expand-icon {
    height: 100%;
    width: 32px;
    text-align: center;
    vertical-align: middle;
    line-height: 40px;
    cursor: pointer;
    display: inline-block;
    float: left;
    
    margin-left: -4px;
    margin-right: 4px;
    transition: all 1s;
}

.main .expand-icon i {
    vertical-align: middle;
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
.search-box input{
    font-size: 1.25em !important;
    padding: 2px !important;
    box-sizing: content-box;
    width: 220px;
}

.slide-v-enter-active, .slide-v-leave-active {
  max-height: 1000px;
  transition: max-height 0.5s ease-in;
}

.slide-v-enter, .slide-v-leave-to /* .slide-h-leave-active below version 2.1.8 */ {
  /*opacity: 0;*/
  max-height: 0;
}

.slide-h-enter-active, .slide-h-leave-active {
  max-width: 300px;
  transition: max-width 0.5s ease-in, opacity 0.5s ease-in;
}

.slide-h-enter, .slide-h-leave-to /* .slide-h-leave-active below version 2.1.8 */ {
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
