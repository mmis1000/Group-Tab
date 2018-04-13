import Vue from 'vue';
import Vuex from 'vuex';

import mutations from './mutations';
import actions from './actions';
import tabs from './modules/tabs';
import bookmarks from './modules/bookmarks';
import setting from './modules/setting';
import history from './modules/history';
// import createLogger from '../../../src/plugins/logger'

/* global LRUCache */

Vue.use(Vuex);

// const debug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({
  state: {
    keywordCache: new LRUCache(-1, false, new LRUCache.LocalStorageCacheStorage()),
  },
  modules: {
    tabs,
    bookmarks,
    setting,
    history,
  },
  mutations,
  actions,
  // strict: debug,
  // plugins: debug ? [createLogger()] : []
});