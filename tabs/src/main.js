import Vue from 'vue';

import store from './store';
import App from './App.vue';
import Item from './list/Item.vue';

import VueRouter from 'vue-router';
Vue.use(VueRouter);

// recursive components need to be global
Vue.component('item', Item);

window.app = new Vue({/*
  data : {
    tabs: [2],
    groups: []
  },
  methods: {
    updateTabs(tab){
        this.tabs.push(tab)
    }
  },*/
  store,
  el: '#app',
  render: function (h) {
      return h(App);
  },
});
