// ==UserScript==
// @name         Basecamp3 Powerpack - Hide Todos
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Hide all todos.
// @author       greatghoul@gmail.com
// @match        https://3.basecamp.com/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

/**

 ChangeLog

 v0.1

   - Hide all todos
 */

(function() {
    'use strict';

    const ID_CONTAINER = 'gg-bs3-panel-right';
    const ID_COMPONENT = 'gg-bs3-hide-todos';
    const CLASS_NAME = 'gg-bs3-hide-todos';

    function createNode (parent, id) {
        let node = document.getElementById(id);
        if (!node) {
            node = document.createElement('div');
            node.id = id;
            parent.appendChild(node);
        }

        return node;
    }

    function removeNode (id, force) {
        const node = document.getElementById(id);
        node && node.remove();
    }

    function removeEmptyNode (id) {
        const node = document.getElementById(id);
        node.children.length === 0 && node.remove();
    }

    function getTarget () {
        return document.querySelector('div.todolists');
    }

    function toggleEnabled (enabled) {
        if (enabled) {
            document.body.classList.add(CLASS_NAME);
        } else {
            document.body.classList.remove(CLASS_NAME);
        }
    }

    function render () {
        const target = getTarget();
        if (!target) {
            clean();
            return;
        }

        const container = createNode(document.body, ID_CONTAINER);
        const component = createNode(container, ID_COMPONENT);
        const checked = document.body.classList.contains(CLASS_NAME) ? 'checked' : '';
        component.innerHTML = `<label style="margin-top:20px;"><div>Hide Todos</div> <input type="checkbox" ${checked} /></label>`;
        component.querySelector('input').addEventListener('change', evt => toggleEnabled(evt.target.checked));
    }

    function clean () {
        removeNode(ID_COMPONENT);
        removeEmptyNode(ID_CONTAINER);
    }

    function init () {
        GM_addStyle('body.gg-bs3-hide-todos .todos { display: none }');
        GM_addStyle('body.gg-bs3-hide-todos .todolist-actions { display: none }');
        GM_addStyle('body.gg-bs3-hide-todos .todo-progress__ratio { display: none }');
        GM_addStyle('body.gg-bs3-hide-todos .todolist-groups { display: none }');
        GM_addStyle('body.gg-bs3-hide-todos .todolist__description { display: none }');
        GM_addStyle('body.gg-bs3-hide-todos .todolist__description--truncated { display: none }');

        GM_addStyle('body.gg-bs3-hide-todos .todolists>.todolist { margin-bottom: 1em }');

        const target = getTarget();
        if (target) {
            const observer = new MutationObserver(render);
            observer.observe(target, { attributes: true, childList: true });
            render();
        }
    };

    document.addEventListener('turbolinks:load', init);
})();
