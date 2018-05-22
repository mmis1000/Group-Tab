/**
 * @typedef {Object} Frame
 * @property {string} path
 */

/**
 * @typedef {"back"|"forward"} Direction
 */

class State {
    constructor(){
      /** @type {number} */
      this.stackHead = 0;
      /** @type {Frame[]} */
      this.stack = [];
      /** @type {Frame[]} */
      this.stashedStack = [];
      /** @type {Frame?} */
      this.currentFrame = null;
      /** @type {Direction} */
      this.navigateDirection = null;
    }
  }
  

export default {
    namespaced: true,
    state: new State(),
    mutations: {
        /**
         * @param {State} state
         * @param {Frame} frame
         */
        setCurrentFrame(state, frame) {
            state.currentFrame = frame;
        },
        /**
         * @param {State} state
         * @param {Frame} frame
         */
        pushStack(state, frame) {
            // kill the stash area
            if (state.stackHead < 0) {
                state.stackHead = 0;
            }

            state.stashedStack = [];

            if (
                typeof frame === 'object' && frame != null &&
                typeof frame.path === 'string'
            ) {
                state.stack.push(frame);
                state.currentFrame = frame;                
            } else {
                throw new Error('bad object');
            }
        },
        /**
         * @param {State} state
         */
        popStack(state) {
            if (state.stack.length > 0) {
                var poped = state.stack.pop();

                state.currentFrame = state.stack[state.stack.length - 1] || null;

                return poped;
            } else {
                return null;
            }
        },
        /**
         * @param {State} state
         */
        stashStack(state) {
            if (state.stack.length > 0) {
                state.stashedStack.unshift(state.stack.pop());
                state.currentFrame = state.stack[state.stack.length - 1] || null;
            } else if (state.stashedStack.length > 0){
                state.stackHead--;
            }
        },
        /**
         * @param {State} state
         */
        unstashStack(state) {
            if (state.stackHead < 0) {
                state.stackHead++;
            } else if (state.stashedStack.length > 0) {
                state.stack.push(state.stashedStack.shift());
                state.currentFrame = state.stack[state.stack.length - 1] || null;
            }
        },
        /**
         * @param {State} state
         * @param {Direction} direction
         */
        setDirection(state, direction) {
            state.navigateDirection = direction;
        },
        /**
         * @param {State} state
         */
        drop(state) {
            state.stackHead = 0;
            state.stack = [];
            state.stashedStack = [];
            state.currentFrame = null;
        }
    },
    actions: {
        /**
         * @param {Frame} frame
         */
        pushStack(/** @type {{commit: function}}*/{ commit }, frame) {
            commit('pushStack', frame);
        },
        popStack(/** @type {{commit: function}}*/{ commit }) {
            commit('popStack');
        },
        /**
         * @param {Direction} direction
         */
        setDirection(/** @type {{commit: function}}*/{ commit }, direction) {
            commit('setDirection', direction);
        },
        stashStack(/** @type {{commit: function}}*/{ commit }) {
            commit('stashStack');
        },
        unstashStack(/** @type {{commit: function}}*/{ commit }) {
            commit('unstashStack');
        },
        drop(/** @type {{commit: function}}*/{ commit }) {
            commit('drop');
        }
    }
};