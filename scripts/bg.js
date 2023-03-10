(function () {

    var tabsManager = {
        // relative path
        imagePaths: {
            active: {
                19: '../icons/icon-19x19.png',
                38: '../icons/icon-38x38.png'
            },
            inactive: {
                19: '../icons/icon-19x19-inactive.png',
                38: '../icons/icon-38x38-inactive.png'
            }
        },
        setTabCount: function (wId, tId, count) {
            this[wId] = this[wId] ? this[wId] : {};
            this[wId][tId] = count || '';
        },
        getTabCount: function (wId, tId) {
            if (!this[wId]) return '';
            return this[wId][tId] || '';
        },
        clearTab: function (wId, tId) {
            if (!this[wId]) return;
            delete this[wId][tId];
        },
        setBadge(wId, tId, count) {
            var count = count || this.getTabCount(wId, tId);
            this.setTabCount(wId, tId, count);
            chrome.action.setBadgeText({ text: count });
        }
    };

    chrome.runtime.onMessage.addListener(function (msg, sender, callback) {
        var tId = sender.tab.id;
        var wId = sender.tab.windowId;
        if (msg.event === 'get_tId_and_wId') {
            callback({ tId: tId, wId: tId });
        } else {
            chrome.action.setIcon({ path: tabsManager.imagePaths[msg.event], tabId: tId });
            if (msg.event === 'inactive') {
                if (msg.url) console.log('Avoided execution in: ' + msg.url);
                chrome.browserAction.setBadgeText({ text: '' });
            } else if (msg.event === 'active') {
                tabsManager.setBadge(wId, tId, msg.count.toString());
            }
        }
    });

    chrome.tabs.onActivated.addListener(function (activeInfo) {
        var tId = activeInfo.tabId;
        var wId = activeInfo.windowId;
        tabsManager.setBadge(wId, tId);
    });

    chrome.tabs.onRemoved.addListener(function (removedInfo) {
        var tId = removedInfo.id;
        var wId = removedInfo.windowId;
        tabsManager.clearTab(wId, tId);
    })

})();
