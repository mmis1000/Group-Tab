<template>
  <div>
    <div class="sidebar">
        <div class="item">
            <i class="fas fa-book fa-2x"></i>
            Current Tabs
        </div>
        <div class="bottom">
            <div class="item">
                <i class="fas fa-save fa-lg"></i>
                Save
            </div>
            <div class="item">
                <i class="fas fa-save fa-lg"></i>
                Save and close
            </div>
            <div class="item">
                <i class="fas fa-times-circle fa-lg"></i>
                Close
            </div>
            <div class="item">
                <i class="fas fa-times fa-lg" style="color: red;"></i>
                Cancel
            </div>
        </div>
    </div>
    
    
    <div class="main">
        <h1 class='browser-style'>Your current tabs {{ tabs.length }}</h1>
        <!--<pre id="test"></pre>-->
        <div v-for="group in groups" class='browser-style'>
            <div v-bind:class="['item', 'head', 'browser-style', group.halfChecked? 'partial-selected': '', group.show? 'expanded': '' ]">
                <div class='div expand-icon' @click="group.show = !group.show">
                    <i class="fas fa-angle-down fa-2x"></i>
                </div>
                
                <input 
                    type="checkbox" 
                    v-bind:id="`input-${group.id}`" 
                    v-model:checked="group.checked" 
                    @change="setGroupChecked(group)"
                />
                <label v-bind:for="`input-${group.id}`">{{ group.keyword }} ({{ group.pages.length }})</label>
            </div>
            
            <transition name="fade">
                <div  v-if="group.show" class='browser-style'>
                    <subitem v-for="page in group.pages" v-bind:page="page" v-bind:group="group"/>
                <!--
                    <div v-for="page in group.pages" class='item browser-style sub'>
                        <input type="checkbox" v-bind:id="`input-${group.id}-${page.id}`" v-model="page.checked"/>
                        <label v-bind:for="`input-${group.id}-${page.id}`">{{ page.title }}</label>
                    </div>
                    -->
                </div>
            </transition>
        </div>
    </div>
    

    
    <div class="edit-panel">
        <div class="search-box browser-style">
            <input type="text" id="search" placeholder="search for tabs">
            <label for="search"></label>
        </div>
        <div class="item">
            <i class="fas fa-hand-pointer fa-lg"></i>
            Select all
        </div>
        <div class="item">
            <i class="far fa-hand-pointer fa-lg"></i>
            Unselect all
        </div>
        <div class="item">
            <i class="fas fa-boxes fa-lg"></i>
            Multi select
        </div>
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
      keywordCache: new LRUCache(-1, false, new LRUCache.LocalStorageCacheStorage()),
      querying: browser.tabs.query({}),
      pages: [],
      id: 0,
      tabs: [],
      groups: []
    }
  },
  methods: {
    update() {
        let vm = this;
        vm.pages = [];
        vm.querying.then((tabs)=>{        
            tabs.forEach((t)=>{
                if (t.title) {
                    if (vm.keywordCache.getItem(t.title.toLowerCase())) {
                        vm.pages.push(Promise.resolve({
                            keywords: vm.keywordCache.getItem(t.title.toLowerCase()),
                            title: t.title,
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
                        show: false,
                        pages: pages.filter((page)=>page.keywords.indexOf(w) >= 0).map((o)=>{
                            o.checked = false;
                            o.id = vm.id++;
                            // force a surface  clone
                            return Object.assign({}, o);
                        })
                    }
                })
                .sort((i, j)=>j.pages.length - i.pages.length)
                .filter((i)=>i.pages.length > 1)
                
                console.log(`groups has > 1 item: ${sorted.length}`);
                console.log(sorted)
                
                
                vm.tabs= tabs;
                vm.groups= sorted;
                
            })
        });
    },
    setGroupChecked(group) {
        group.pages.forEach((p)=>p.checked = group.checked)
    }
  },
  mounted() {
    // `this` points to the vm instance
    setTimeout(()=>{
        this.update();
    })
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

.main .item {
    min-height: 40px;
    /*border-bottom: 1px solid #ddd;*/
    padding: 0px 8px;
    line-height: 40px;
    vertical-align: middle;
    margin-bottom: 0px;
    position: relative
}

.main .item.sub {
    margin-left: 40px;
}

.main .item.partial-selected label::before{
    opacity: 0.5;
}

.main .item.expanded .expand-icon {
    transform: rotate(180deg)
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
    left: 268px;
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

.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}

.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}


</style>
