export default /** @returns {function} */ function Factory() {
  /**
   * @typedef {Object} TreeNode
   * @property {string} text
   * @property {string} path
   * @property {boolean} checked
   * @property {boolean} halfChecked
   * @property {boolean} selected
   * @property {number} checkedCount
   * @property {string} url
   * @property {boolean} isFolder
   * @property {number} total
   * @property {string} parent
   * @property {boolean} dirty
   * @property {any} data
   * @property {TreeNode[]} children
   * @property {boolean} enabled
   * @property {boolean} expanded
   */ 

  /**
   * @type {TreeNode}
   */
  var oldTree = null;

  /**
   * @typedef {Object} SourceLike
   * @property {string} text
   * @property {string} url
   * @property {string} path
   * @property {boolean} isFolder
   * @property {string} parent
   * @property {any} data
   * @property {string[]} children
   */

  /**
   * @param {Map<string, SourceLike>} map
   * @param {string} root
   * @returns {TreeNode}
   */
  const func = (map, root) => {
    console.time('tree_gen');

    /**
     * @param {string} name
     * @param {TreeNode} oldLeaf
     * @returns {TreeNode}
     */
    var generateNode = (name, oldLeaf) => {
      /** @type {TreeNode} */
      let res;
      let data = map.get(name);

      if (!oldLeaf /*true*/ ) {
        // console.log('new leaf', data.path);
        res = /** @type {TreeNode} */ ({
          text: (data.text || data.url || '<unamed item>'),
          path: data.path,
          checked: false,
          halfChecked: false,
          selected: false,
          checkedCount: 0,
          url: data.url,
          isFolder: data.isFolder,
          total: null, // generate after its subtree generated
          parent: data.parent,
          dirty: false, // touch this to fire force check
          data: data.data || {},
          children: /** @type {TreeNode[]} */([]),
          enabled: false,
          expanded: false
        });

        if (data.children && data.children.length > 0) {
          res.children = data.children.map((node) => generateNode(node, null));
          res.total = Math.max(res.children.reduce((prev, curr) => prev + curr.total, 0));
        } else {
          res.children = /** @type {TreeNode[]} */([]);
          res.total = 1;
        }


      } else {
        // console.log('old leaf');
        res = oldLeaf;

        Object.assign(res, {
          text: data.text || data.url || '<unamed item>',
          path: data.path,
          parent: data.parent,
          url: data.url,
          data: data.data || {},
        });

        /** @type {Map<string, true>} */
        let newChilds = new Map();
        data.children.forEach((child) => newChilds.set(child, true));

        /** @type {Map<string, TreeNode>} */
        let oldChilds = new Map();
        res.children.forEach((child) => oldChilds.set(child.path, child));
        // console.log(res.path, Array.from(oldChilds.keys()))
        // remove childs that no longer exist

        for (let i = res.children.length - 1; i >= 0; i--) {
          if (!newChilds.has(res.children[i].path)) {
            res.children.splice(i, 1);
          }
        }

        for (let i = 0; i < data.children.length; i++) {
          if (oldChilds.has(data.children[i])) {
            // console.log('has ' + data.children[i] + ' parent ' + res.path + ' ' + oldChilds.get(data.children[i]))
            generateNode(data.children[i], oldChilds.get(data.children[i]));
          } else {
            // console.log('not ' + data.children[i] + ' parent ' + res.path + ' ' + oldChilds.get(data.children[i]))
            let newChild = generateNode(data.children[i], null);
            res.children.push(newChild);
          }
        }

        if (data.children && data.children.length > 0) {
          res.total = Math.max(res.children.reduce((prev, curr) => prev + curr.total, 0));
          res.checkedCount = res.children.reduce((prev, curr) => prev + curr.checkedCount, 0);
          res.checked = res.checkedCount > 0;
          res.halfChecked = res.checkedCount > 0 && res.checkedCount < res.total;
        } else {
          res.children = [];
          res.total = 1;
          res.checkedCount = res.checked ? 1 : 0;
          res.halfChecked = false;
        }
      }

      return res;
    };

    var res = generateNode(root, oldTree);

    console.timeEnd('tree_gen');

    oldTree = res;

    return res;
  };

  return func;
};