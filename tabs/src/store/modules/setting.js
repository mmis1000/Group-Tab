class State {
  constructor(){
    /** @type {function[]} */
    this.queue = [];
    /** @type {boolean} */
    this.loading = false;
    /** @type {boolean} */
    this.loaded = false;
    /** @type {string[]} */
    this.blacklist = ["的","，","in","the","a","and","at","for","to","is","are","of","by","|","│",":","：","0","1","2","3","4","5","6","7","8","9","!","?",".","·","、","！","？"];
    /** @type {string[]} */
    this.blacklistStash = this.blacklist.slice(0);
  }
}

export default {
  namespaced: true,
  state: new State(),
  mutations: {
    /**
     * 
     * @param {State} state 
     * @param {string[]} list 
     */
    setBlacklist(state, list) {
      state.blacklist = list;
    },
    /**
     * 
     * @param {State} state 
     * @param {string[]} list 
     */
    setBlacklistStash(state, list) {
      state.blacklistStash = list;
    },
    /**
     * 
     * @param {State} state 
     * @param {boolean} value 
     */
    setLoading(state, value) {
      state.loading = value;
    },
    /**
     * 
     * @param {State} state 
     * @param {boolean} value 
     */
    setLoaded(state, value) {
      state.loaded = value;
    },
    /**
     * 
     * @param {State} state 
     * @param {function} fn 
     */
    addQueue(state, fn) {
      state.queue.push(fn);
    },
    /**
     * 
     * @param {State} state 
     * @param {function} fn 
     */
    clearQueue(state) {
      state.queue.length = 0;
    },
  },  
  actions: {
    async reload(/** @type {{state: State, commit: function, dispatch: function}} */{ state, commit, dispatch }) {
      if (state.loading && !state.loaded) {
        // as we are loadin now
        return;
      }

      if (!state.loaded) {
        return dispatch('setting/load');
      }

      const data = await browser.storage.local.get("setting");
      const setting = data.setting;
      if (!setting) return;

      const blacklist = setting.blacklist;

      if (!blacklist) return;

      commit('setBlacklist', blacklist);
      commit('setBlacklistStash', blacklist);
    },
    async load(/** @type {{state: State, commit: function}} */{ state, commit }) {
      if (state.loaded) {
        return;
      }

      return new Promise((resolve)=>{
        commit('addQueue', resolve);

        if (state.loading) {
          return;
        }

        commit('setLoading', true);

        const loadAsync = async ()=>{
          const data = await browser.storage.local.get("setting");
          const setting = data.setting;

          if (!setting) {
            commit('setLoaded', true);
            commit('setLoading', false);
            return;
          }
    
          const blacklist = setting.blacklist;
    
          if (!blacklist) {
            commit('setLoaded', true);
            commit('setLoading', false);
            return;
          }
    
          commit('setBlacklist', blacklist);
          commit('setBlacklistStash', blacklist);
          commit('setLoaded', true);
          commit('setLoading', false);

          state.queue.forEach(fn=>fn());
          commit('clearQueue');
        }

        loadAsync();
      })
    },
    async save(/** @type {{state: State, commit: any}} */{ state, commit }) {
      commit('setBlacklist', state.blacklistStash);
      
      var toSave = {
        blacklist: state.blacklist
      };

      await browser.storage.local.set({
        setting: toSave
      });
    },
    /**
     * @param {string[]} blacklist
     */
    async setBlacklist(/** @type {{commit: function}} */{ commit }, blacklist) {
      commit('setBlacklistStash', blacklist);
    },
  }
};