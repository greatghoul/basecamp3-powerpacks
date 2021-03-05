// ==UserScript==
// @name         Basecamp3 Powerpack - Pings+
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Pings enhancement.
// @author       greatghoul@gmail.com
// @match        https://3.basecamp.com/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const ID_CHAT_NAME_ALIAS = 'gg-bs3-chat-name-alias';
    const ID_CHAT_NAME_TOOLS = 'gg-bs3-chat-name-tools';
    const ID_CHAT_PIN_SECTION = 'gg-bs3-section-pinned-chat';

    function getChatHeader () {
        return document.location.pathname.includes('/circles/') && document.querySelector('.chat__header');
    }

    function getChatPopup () {
        return document.querySelector('#navigation_pings');
    }

    function strip(text) {
        return (text || '').replace(/(^\s*|\s*$)/, '');
    }

    function squish (text) {
        return strip((text || '').replace(/\s+/img, ' '))
    }

    function quote (text) {
        return (text || '').replace('<', '&lt;').replace('>', '&gt;').replace('\"', '\\\"');
    }

    function getChatRecord (id) {
        return JSON.parse(window.localStorage[`gg-bs3-chat-${id}`] || '{}')
    }

    function getChatRecords () {
        const chats = [];
        for (const key in localStorage) {
            if (key.startsWith('gg-bs3-chat-')) {
                const chat = JSON.parse(localStorage[key])
                chats.push(chat)
            }
        }
        return chats;
    }


    function saveChatRecord (chat) {
        const data = Object.assign({}, chat, { displayName: chat.aliasName || chat.name })
        window.localStorage[`gg-bs3-chat-${chat.id}`] = JSON.stringify(data);
    }

    function getActiveChat () {
        const name = squish(document.querySelector('.chat__header h4').innerText);
        const url = document.location.pathname.split('@').shift();
        const id = url.split('/').pop();
        const chat = { id, name, url };
        const chatRecord = getChatRecord(id);
        return Object.assign({}, chatRecord, chat, { displayName: chatRecord.aliasName || chat.name });
    }

    function createNode (parent, id, callback = null) {
        let node = document.getElementById(id);
        if (!node) {
            node = document.createElement('div');
            node.id = id;
            callback && callback(node);
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

    function renderChatHeaderAddon () {
        const chat = getActiveChat();
        const chatHeader = getChatHeader();
        const nameAliasNode = createNode(chatHeader, ID_CHAT_NAME_ALIAS);
        nameAliasNode.innerHTML = `<h4 class="flush--ends">${chat.displayName}</h4>`;
        nameAliasNode.title = quote(chat.name);
        chatHeader.querySelector('h4').style.display = 'none';

        const nameToolsNode = createNode(chatHeader, ID_CHAT_NAME_TOOLS, node => {
            node.innerHTML = `
                <a data-action="pin" style="display: none">Pin</a>
                <a data-action="unpin" style="display: none">Unpin</a>
                <a data-action="rename">Rename</a>
            `;
        });

        nameToolsNode.querySelector('[data-action=pin]').addEventListener('click', pinChat, false);
        nameToolsNode.querySelector('[data-action=unpin]').addEventListener('click', unpinChat, false);
        nameToolsNode.querySelector('[data-action=rename]').addEventListener('click', renameChat, false);

        nameToolsNode.querySelector('[data-action=pin]').style.display = chat.pinned ? 'none' : 'inline';
        nameToolsNode.querySelector('[data-action=unpin]').style.display = chat.pinned ? 'inline' : 'none';

    }

    function pinChat () {
        const chat = getActiveChat();
        saveChatRecord(Object.assign(chat, { pinned: true }));
        renderChatHeaderAddon();
    }

    function unpinChat () {
        const chat = getActiveChat();
        saveChatRecord(Object.assign(chat, { pinned: false }));
        renderChatHeaderAddon();
    }

    function renameChat () {
        const chat = getActiveChat();
        const aliasName = window.prompt([
           'Please name the Ping',
           '',
           '- leave name empty to show origin Ping name',
           '- Prefix with numbers to sort pinned Pings. (e.g. "01. xxx")'
        ].join('\n'), chat.aliasName || chat.name);
        if (aliasName !== null) {
          saveChatRecord(Object.assign(chat, { aliasName: squish(aliasName) }));
          renderChatHeaderAddon();
        }
    }

    function renderChatPopupAddon () {
        const chatPopup = getChatPopup();
        if (window.getComputedStyle(chatPopup).display === 'none') return;

        let pinnedSection = document.getElementById(ID_CHAT_PIN_SECTION);
        if (!pinnedSection) {
            pinnedSection = document.createElement('section');
            pinnedSection.id = ID_CHAT_PIN_SECTION;
            pinnedSection.className = 'nav-menu__section centered';

            const unreadSection = chatPopup.querySelector('.readings--pings');
            unreadSection.parentNode.insertBefore(pinnedSection, unreadSection.nextSibling);
        }

        const chats = getChatRecords();
        // const pinnedChats = chats.filter(x => x.pinned).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
        const pinnedChats = chats.filter(x => x.pinned).sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { numeric: true }));
        const renderPinnedChat = (chat) => {
           let tooltip = chat.displayName;
           if (chat.aliasName && chat.aliasName !== chat.name) {
               tooltip += `\n-----------\n${chat.name}`
           }
           return `<div><a href="${chat.url}" title="${quote(tooltip)}">${chat.displayName}</a></div>`;
        };

        pinnedSection.innerHTML = `
            <h3 class="push_quarter--top push_half--bottom break"><span>Pinned Pings</span></h3>
            <div>${pinnedChats.map(renderPinnedChat).join('')}</div>
        `;
    }

    function init () {
        GM_addStyle('#gg-bs3-chat-name-tools { margin-bottom: 10px; }');
        GM_addStyle('#gg-bs3-chat-name-tools a { color: #1b6ac9; font-size: 12px; cursor: pointer; margin-left: 3px; margin-right: 3px; }');
        GM_addStyle('#gg-bs3-section-pinned-chat { margin-bottom: 0; }');
        GM_addStyle('#gg-bs3-section-pinned-chat > div { display: flex; flex-wrap: wrap; }');
        GM_addStyle('#gg-bs3-section-pinned-chat > div > div { text-align: left; width: 33.333%; }');
        GM_addStyle('#gg-bs3-section-pinned-chat > div > div > a { display: block; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 5px 8px; }');
        GM_addStyle('#gg-bs3-section-pinned-chat > div > div > a:hover { background-color: #f6f2ef; border-radius: 5px; }');

        if (getChatHeader()) {
            renderChatHeaderAddon()
        }

        const chatPopup = getChatPopup();
        if (chatPopup) {
            const observer = new MutationObserver(renderChatPopupAddon);
            observer.observe(chatPopup, { attributes: true, childList: true });
        }
    };

    document.addEventListener('turbolinks:load', init);
})();
