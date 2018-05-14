import {TabItem} from './tabs.js';

export class BookmarkItem {
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
    /** @type {{bookmark: BookmarkTreeNode, id: string, type: string?}}} */
    this.data;

    const defaultData = /** @type {BookmarkItem} */ ({
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

const defaultItem = new BookmarkItem({
  parent: null,
  text: "loading...",
  path: 'root',
  isFolder: true
});

const map = new Map();
map.set(defaultItem.path, defaultItem);


class State {
  constructor(){
    /** @type {string} */
    this.rootNodeId = 'root';
    /** @type {BookmarkItem[]} */
    this.list = [defaultItem];
    /** @type {Map<string, BookmarkItem>} */
    this.map = map;
    /** @type {boolean} */
    this.loading = false;
  }
}

export default {
  namespaced: true,
  state:  new State(),
  mutations: {
    /**
     * update the list while keep old items alive
     * @param {State} state
     */
    update(state, /** @type {[BookmarkItem[], string]} */ [ newList, newRoot = 'root' ]) {
      state.rootNodeId = newRoot;

      console.log('patch list', newList);
      
      /** @type {BookmarkItem[]} */
      const list = state.list;
      /** @type {Map<string, BookmarkItem>} */
      const oldItemMap = new Map();
      /** @type {Map<string, BookmarkItem>} */
      const newItemMap = new Map();
      /** @type {BookmarkItem[]} */
      const itemsToRemove = [];
      /** @type {BookmarkItem[]} */
      const itemsToAdd = [];
      /** @type {BookmarkItem[]} */
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
    async load(/** @type {{state:State, commit: Function}} */{ state, commit }) {
      console.log('start loading');
      state.loading = true;

      /** @type {BookmarkItem[]} */
      const list = [];

      const root = (await browser.bookmarks.getTree())[0];
      
      /**
       * 
       * @param {browser.bookmarks.BookmarkTreeNode} node 
       */
      const walk = (node) => {
        let id = node.id;
        let parentId = node.parentId;

        if (node == null) {
          state.rootNodeId = id;
        };

        if (node.type === "folder") {
          let currentNode = new BookmarkItem({
            parent: parentId,
            path: id, // id of this item
            url: node.url,
            text: node.title,
            isFolder: true,
            children: node.children.map((node) => node.id), // id of children
            data: {
              bookmark: node,
              id: node.id
            }, // item specific data
          });

          list.push(currentNode);

          node.children.forEach(walk);
        } else {
          let currentNode = new BookmarkItem({
            parent: parentId,
            path: id, // id of this item
            url: node.url,
            text: node.title,
            isFolder: false,
            children: [], // id of children
            data: {
              bookmark: node,
              id: node.id,
              type: node.type
            }, // item specific data
          });

          list.push(currentNode);
        }
      };

      console.log('walking');
      walk(root);

      console.log('commit', list);
      commit('update', [list, root.id]);

      state.loading = false;
    },
    async remove(/** @type {
      {
        dispatch: function
      }
    } */{
      dispatch
    }, /** @type {BookmarkItem[]} */ bookmarks) {

      console.log('pending remove bookmarks ' + bookmarks);
      await Promise.all(bookmarks.map((bookmark)=>{
        if (bookmark.isFolder) {
          return browser.bookmarks.removeTree(bookmark.data.id);
        } else {
          return browser.bookmarks.remove(bookmark.data.id);
        }
      }));

      await dispatch('load');
    },

    async add(/** @type {{dispatch: function}} */{ dispatch }, /**
     * @type {{tabs: TabItem[], target: BookmarkItem, isGrouped: boolean, name: string?}}
     */{
      tabs, 
      target,
      isGrouped = false,
      name = null, 
    }) {
      // filter tabs
      tabs = tabs.filter((tab)=>!tab.isFolder);

      // do a dedup
      /**
       * @type {Map<string, boolean>}
       */
      var m = new Map();
      tabs = tabs.filter((tab)=>{
        if (!m.has(tab.url)) {
          m.set(tab.url, true);
          return true;
        } else {
          return false;
        }
      });

      let targetId = target.data.id;

      if (isGrouped) {
        // create the root folder
        let folder = await browser.bookmarks.create(
          /** @type {browser.bookmarks.CreateDetails} */({
            parentId: targetId,
            title: name,
            type: "folder",
          })
        );

        let folderId = folder.id;
        await Promise.all(tabs.map((tab)=>browser.bookmarks.create(
          /** @type {browser.bookmarks.CreateDetails} */({
            parentId: folderId,
            title: tab.text,
            type: "bookmark",
            url: tab.url,
          })
        )));

        await dispatch('load');
      } else {
        await Promise.all(tabs.map((tab)=>browser.bookmarks.create(
          /** @type {browser.bookmarks.CreateDetails} */({
            parentId: targetId,
            title: tab.text,
            type: "bookmark",
            url: tab.url,
          })
        )));

        await dispatch('load');
      }
    },
    async open({}, /** @type {BookmarkItem} */ bookmark) {
      console.log(bookmark.url);
      await browser.tabs.create({
        url: bookmark.url
      });
    },
  },
};