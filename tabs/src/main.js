import Vue from 'vue'
import App from './App.vue'

let app = window.app = new Vue({/*
  data : {
    tabs: [2],
    groups: []
  },
  methods: {
    updateTabs(tab){
        this.tabs.push(tab)
    }
  },*/
  el: '#app',
  render: function (h) {
      return h(App)
  }
})
