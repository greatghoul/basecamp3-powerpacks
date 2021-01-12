(function (scope) {
  const ggpacks = {};
  
  ggpacks.createNode = (parent, id) => {
    let node = document.getElementById(id);
    if (!node) {
        node = document.createElement('div');
        node.id = id;
        parent.appendChild(node);
    }

    return node;
  };

  ggpacks.removeNode = (id, force) => {
      const node = document.getElementById(id);
      node && node.remove();
  };

  ggpacks.removeEmptyNode = (id) => {
      const node = document.getElementById(id);
      node.children.length === 0 && node.remove();
  };
  
  ggpacks.observe = (target, callback) =>{
      if (target) {
          const observer = new MutationObserver(render);
          observer.observe(target, { attributes: true, childList: true });
          callback();
      }
  };
  
  if (!window.ggpacks) {
    window.ggpacks = ggpacks;
  }
})(window);
