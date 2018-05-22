<template>
  <div>
    <h1>Setting</h1>
    <section>
      <h2>Blacklisted keywords (reload to take effect)</h2>
      These words won't be think as keyword.
      <textarea 
        style="width: 90%; resize: vertical; min-height: 400px;" 
        class="browser-style" 
        v-model="blacklistText" 
        placeholder="add multiple lines"
        @keydown="updateBlacklist"
      >
      </textarea>
    </section>

    <transition name="slide-v">
      <div class="save-panel" v-if="showSave">
        <div class="item" @click="save">
          <i class="fas fa-save fa-lg"></i>
          Save
        </div>
        <div class="item" @click="cancel">
          <i class="fas fa-times fa-lg" style="color: red;"></i>
          Cancel
        </div>
      </div>
    </transition>

  </div>
</template>
<script>
  export default {
    name: "setting",
    data() {
      return {
        showSave: false
      };
    },
    computed: {
      blacklist () {
        return this.$store.state.setting.blacklist;
      },
      blacklistText: { 
        get() {
          return this.blacklist.join('\n');
        },
        set(text) {
          console.log(text);
          this.$store.dispatch('setting/setBlacklist', text.split('\n'));
        },
      },
    },
    methods: {
      updateBlacklist(/*e*/) {
        this.showSave = true;
      },
      async cancel() {
        await this.$store.dispatch('setting/reload');
        this.showSave = false;
      },
      async save() {
        await this.$store.dispatch('setting/save');
        this.showSave = false;
      },
    }
  };
</script>
<style scoped>
  h1 {
    padding-left: 8px;
    margin-top: 0px;
  }

  .save-panel {
    position: fixed;
    bottom: 0px;
    left: 0px;
    width: 240px;
    padding-bottom: 34px;
  }

  .save-panel .item {
    height: 48px;
    line-height: 48px;
    margin-left: 34px;
    font-size: 1.25em;
    vertical-align: middle;
    border-radius: 4px;

    cursor: pointer;
  }

  .save-panel .item:hover {
    background: #ccc;
  }

  .save-panel .item i {
    vertical-align: middle;
    margin-left: 4px;
    margin-right: 4px;
    width: 32px;
    text-align: center;
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

  section {
    padding: 0px 8px;
  }
</style>