/// <reference path="../../../assets/jieba/scripts/preload.js" />
import {BookmarkItem} from './bookmarks';

export class TabItem {
  constructor(opts = {}) {
    /** @type {string} */
    this.parent;
    /** @type {string} */
    this.path;
    /** @type {string} */
    this.url;
    /** @type {string} */
    this.text;
    /** @type {boolean} */
    this.isFolder;
    /** @type {string[]} */
    this.children;
    /** @type {{tab: browser.tabs.Tab|null, id:number|null}}} */
    this.data;

    const defaultData = /** @type {TabItem} */ ({
      parent: null,
      path: null, // id of this item
      url: null,
      text: null,
      isFolder: true,
      children: [], // id of childs
      data: {}, // item specific data
    });
    
    Object.assign(this, defaultData, opts);
  }
}


const defaultItem = new TabItem({parent: null, text: "loading...", path: 'root', isFolder: true});
const map = new Map();
map.set(defaultItem.path, defaultItem);

class State {
  constructor(){
    /** @type {string} */
    this.rootNodeId = 'root';
    /** @type {TabItem[]} */
    this.list = [defaultItem];
    /** @type {Map<string, TabItem>} */
    this.map = map;
    /** @type {boolean} */
    this.loading = false;
  }
}

export default {
  namespaced: true,
  state: new State(),
  mutations: {
    /**
     * update the list while keep old items alive
     * @param {State} state
     */
    update (state, /** @type {[TabItem[], string]} */ [ newList, newRoot = 'root']) {
      state.rootNodeId = newRoot;
      
      console.log('patch list', newList);
      
      /** @type {TabItem[]} */
      const list = state.list;
      /** @type {Map<string, TabItem>} */
      const oldItemMap = new Map();
      /** @type {Map<string, TabItem>} */
      const newItemMap = new Map();
      /** @type {TabItem[]} */
      const itemsToRemove = [];
      /** @type {TabItem[]} */
      const itemsToAdd = [];
      /** @type {TabItem[]} */
      const itemsToPatch = [];
      
      for (let item of list) {
        oldItemMap.set(item.path, item);
      }
      
      for (let item of newList) {
        newItemMap.set(item.path, item);
      }
      
      for (let item of list) {
        if (!newItemMap.has(item.path)) {
          itemsToRemove.push(item);
        } else {
          itemsToPatch.push(item);
        }
      }
      
      for (let item of newList) {
        if (!oldItemMap.has(item.path)) {
          itemsToAdd.push(item);
        }
      }
      
      // patch the list...
      
      console.log('patch list 0 remove old', itemsToRemove.length);
      // remove unused item
      let itemToRemove = itemsToRemove.pop();
      for (let i = list.length - 1; i >= 0; i--) {
        if (!list[i]) {
          continue;
        }

        if (!itemToRemove) break;
        
        if (itemToRemove.path === list[i].path) {
          list.splice(i, 1);
          itemToRemove = itemsToRemove.pop();
          i++;
        }
      }
      
      console.log('patch list 1 patch old', itemsToPatch.length);
      // patch old items
      for (let i = list.length - 1; i >= 0; i--) {
        Object.assign(list[i], newItemMap.get(list[i].path));
      }
      
      console.log('patch list 1 add new', itemsToAdd.length);
      // insert new items
      for (let i = itemsToAdd.length - 1; i >= 0; i--) {
        list.push(itemsToAdd[i]);
      }
      
      // update the map
      state.map.clear();
      
      for (let item of list) {
        state.map.set(item.path, item);
      }
      
      console.log('patch list done', list);
    },
  },
  actions: {
    async load(/** @type {{dispatch: function, commit: function, rootState: any, state: State}} */{ dispatch, commit, rootState, state }) {
      await dispatch('setting/load');

      /** 
       * @param {string[]} keywords
       * @return {string[]} 
       */
      const filterKeywords = (keywords)=>{
        let blacklist = rootState.setting.blacklist;
        return keywords.filter((k)=>{
          return blacklist.indexOf(k) < 0;
        });
      };
      
      state.loading = true;

      let tabs = await browser.tabs.query({});
       
      /**
        * @typedef MappedTab
        * @type {object}
        * @property {string[]} keywords - keywords
        * @property {string} title - title.
        * @property {string} url - url
        * @property {any} id - id
        * @property {any} tab - tab
        */

      /** @type {Array<MappedTab?>} */
      let pages = await Promise.all(
        tabs.map((t)=>{
          if (t.title) {
            if (rootState.keywordCache.getItem(t.title.toLowerCase())) {
              return Promise.resolve({
                keywords: rootState.keywordCache.getItem(t.title.toLowerCase()),
                title: t.title,
                url: t.url,
                id: t.id,
                tab: t
              });
            } else {
              return cut(t.title.toLowerCase()).then((res)=>{
                res = res.filter((i)=> !/^[\u0000-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E]*$/.test(i));
                
                rootState.keywordCache.setItem(
                  t.title.toLowerCase(), 
                  res
                );
                
                console.log(res);
                
                return {
                  keywords: res,
                  title: t.title,
                  url: t.url,
                  id: t.id,
                  tab: t
                };
              });
            }
          } else {
            return Promise.resolve(null);
          }
        })
      );
      
      pages = pages.filter((i)=> i != null);
      
      /** @type {string[]} */
      var keywords = pages.reduce((prev, curr)=>{
        curr.keywords.forEach((k)=>{
          if (prev.indexOf(k) < 0) {
            prev.push(k);
          }
        });
        
        return prev;
      }, []);
      
      console.log(keywords);
      
      keywords = filterKeywords(keywords);
      
      console.log('filtered', keywords);
      
      /**
        * @typedef GroupedPages
        * @type {object}
        * @property {string} keyword - keywords
        * @property {MappedTab[]} pages - title.
        */

      /** @type {GroupedPages[]} */
      let sorted = keywords.map((w)=>{
        return {
          keyword: w,
          pages: pages.filter((page)=>page.keywords.indexOf(w) >= 0).map((o)=>{
            return Object.assign({}, o);
          })
        };
      })
      .sort((i, j)=>j.pages.length - i.pages.length)
      .filter((i)=>i.pages.length > 1);
      
      console.log(`groups has > 1 item: ${sorted.length}`);
      console.log(sorted);
      
      /** @type {GroupedPages} */
      var ungroupableItems = {
        keyword: '<Ungroupable Pages>',
        pages: pages.filter(
          (currentPage)=>{
            var exist = sorted.reduce((prev, group)=>{
              return prev || group.pages.reduce((prev, page)=>{
                return prev || (currentPage.tab === page.tab);
              }, false);
            }, false);
            return !exist;
          }
        ).map((o)=>{
          return Object.assign({}, o);
        })
      };
      
      sorted.push(ungroupableItems);
      
      // now transform it to flat list
      /** @type {TabItem[]} */
      let mapped = [];
      
      let rootNode = new TabItem({
        parent: null, 
        path: 'root', 
        isFolder: true
      });
      
      mapped.push(rootNode);
      
      // add sub nodes
      for (let group of sorted) {
        /**
         * @type {string};
         */
        let parentPath;
        
        try {
          parentPath = 'root/' + encodeURIComponent(group.keyword);
        } catch (err) {
          parentPath = 'root/' + group.keyword.replace('/', '%2F');
        }

        rootNode.children.push(parentPath);
        
        let children = group.pages.map((page)=>new TabItem({
          parent: parentPath,
          path: parentPath + '/' + page.id,
          url: page.url,
          text: page.title,
          isFolder: false,
          children: [],
          data: {
            tab: page.tab,
            id: page.id,
          }
        }));
        
        mapped = mapped.concat(children);
        
        mapped.push(new TabItem({
          parent: "root",
          path: parentPath, // id of this item
          url: null,
          text: group.keyword,
          isFolder: true,
          children: children.map((child)=>child.path), // id of childs
          data: {
            keyword: group.keyword
          }, // item specific data
        }));
      }
      console.log(mapped);
      commit('update', [ mapped ]);

      state.loading = false;
    },
    /**
     * 
     * @param {*} param0 
     * @param {TabItem} tab 
     */
    async jumpTo({ }, tab) {
      await browser.tabs.update(
        tab.data.tab.id,
        {
          active: true
        }
      );
      
      await browser.windows.update(
        tab.data.tab.windowId,
        {
          focused: true
        }
      );
    },
    /**
     * @param {TabItem[]} tabs 
     */
    async remove(/** @type {{dispatch: function}} */{ dispatch }, tabs) {
      tabs = tabs.filter((tab)=>!tab.isFolder);
    
      var m = new Map();
      
      // dedup
      tabs = tabs.reduce((prev, curr)=>{
        if (!m.has(curr.data.id)) {
          m.set(curr.data.id, true);
          prev.push(curr);
        }
        
        return prev;
      }, []);
      
      try {
        await Promise.all(tabs.map((tab)=>{
          if (tab.data.id !== browser.tabs.TAB_ID_NONE) {
            return browser.tabs.remove(tab.data.id);
          } else {
            return Promise.resolve(null);
          }
        }));
      } catch (err) {
        // don't panic, we don't care
      }
      await dispatch('load');
    },
    async removeAndAddToBookmarks(/** @type {{dispatch: function}} */{ dispatch }, 
    /**
       @type {{
        tabs: TabItem[],
        target: BookmarkItem,
        isGrouped: boolean,
        name: string?,
       }}
     */
    {
      tabs, 
      target,
      isGrouped = false,
      name = null, 
    }) {
      await dispatch('addToBookmarks', {
        tabs, 
        target,
        isGrouped,
        name, 
      });
      await dispatch('remove', tabs);
    },
    async addToBookmarks(/** @type {{dispatch: function}} */{ dispatch }, 
      /**
         @type {{
          tabs: TabItem[],
          target: BookmarkItem,
          isGrouped: boolean,
          name: string?,
         }}
       */
    {
      tabs, 
      target,
      isGrouped = false,
      name = null, 
    }) {
      console.log(tabs);
      await dispatch('bookmarks/add', {
        tabs, 
        target, 
        isGrouped,
        name, 
      }, {root:true});
    }
  }
};
