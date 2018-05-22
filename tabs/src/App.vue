<template>
  <div>
    <div class="sidebar" @click.capture="(e)=>mode !== 'normal'? e.preventDefault(): ''">
      <router-link class="item" tag="div" to="/tabs">
        <i class="fas fa-book fa-2x"></i>
        Current Tabs
      </router-link>
      <router-link class="item" tag="div" to="/bookmarks">
        <i class="fas fa-save fa-2x"></i>
        Bookmarks
      </router-link>
      <router-link class="item" tag="div" to="/setting">
        <i class="fas fa-cog fa-2x"></i>
        Setting
      </router-link>
    </div>

    <div class="main">
      <transition name="fade">
        <keep-alive>
          <router-view></router-view>
        </keep-alive>
      </transition>
    </div>
    <!--
    <div style="position: fixed; right: 0px; top: 0px; width: 400px; background: white; white-space: pre-wrap;">
{{stackText}}
    </div>
    -->
  </div>
</template>

<script>
  import VueRouter from 'vue-router';

  import Booksmarks from './pages/Bookmarks.vue';
  import Tabs from './pages/Tabs.vue';
  import Setting from './pages/Setting.vue';

  import Vue from 'vue';
  import Navigation from 'vue-navigation';
  import store from './store';

  const routes = [{
      path: '/tabs',
      name: 'tabs',
      component: Tabs,
    },
    {
      path: '/bookmarks',
      name: 'bookmarks',
      component: Booksmarks,
    },
    {
      path: '/setting',
      name: 'setting',
      component: Setting,
    }
  ];

  const router = new VueRouter({
    routes, // （缩写）相当于 routes: routes
    scrollBehavior(to, from, savedPosition) {
      console.log(store.state.history.navigateDirection, savedPosition);
      if (store.state.history.navigateDirection === 'back') {
        console.log('leaving frame');
        store.dispatch('history/stashStack');
      }

      if (store.state.history.navigateDirection === 'forward') {
        if (savedPosition) {
          console.log('entering old frame');
          store.dispatch('history/unstashStack');
        } else {
          /*
          store.dispatch('history/pushStack', {
            path: to.path,
            id: id++,
            time: (new Date()).toLocaleString()
          })
          */
          console.log('entering new frame');
        }
      }
    }
  });

  Vue.use(Navigation, {
    router,
    store
  });

  export default {
    name: 'app',
    router,
    data() {
      return {};
    },
    computed: {
      stackText() {
        return this.$store.state.history.stack.map(
          (item) => `${item.mode} enter ${item.path}`
        ).join('\n');
      },
      mode() {
        return (this.$store.state.history.currentFrame &&
            this.$store.state.history.currentFrame.mode === 'select') ?
          'select' :
          'normal';
      },
    },
    async mounted() {
      await this.$store.dispatch('setting/load');

      this.$navigation.on('back', () => {
        console.log('on back');
        // trim the stack that no longer used
        this.$store.dispatch('history/setDirection', 'back');
      });

      this.$navigation.on('forward', () => {
        console.log('on forward');
        // trim the stack that no longer used
        this.$store.dispatch('history/setDirection', 'forward');
      });
    },
    components: {
      tabs: Tabs,
      bookmarks: Booksmarks
    }
  };
</script>

<style scoped>
  .main {
    margin-left: 268px;
    padding-top: 80px;
    box-sizing: border-box;
    /*overflow: auto;*/
    /*max-width: 664px;*/
  }

  .sidebar {
    width: 240px;
    position: fixed;
    left: 0px;
    top: 0px;
    bottom: 0px;

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

  .sidebar .item.router-link-active {
    color: #008aff;
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

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity .5s;
    position: absolute;

  }

  .fade-enter,
  .fade-leave-to
  /* .fade-leave-active below version 2.1.8 */

    {
    opacity: 0;
  }
</style>