class State {
  constructor(){
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
    async setBlacklist(state, list) {
      state.blacklist = list;
    },
    /**
     * 
     * @param {State} state 
     * @param {string[]} list 
     */
    async setBlacklistStash(state, list) {
      state.blacklistStash = list;
    }
  },  
  actions: {
    async load(/** @type {{commit: function}} */{ commit }) {
      const data = await browser.storage.local.get("setting");
      const setting = data.setting;
      if (!setting) return;

      const blacklist = setting.blacklist;

      if (!blacklist) return;

      commit('setBlacklist', blacklist);
      commit('setBlacklistStash', blacklist);
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