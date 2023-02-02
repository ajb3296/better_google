(function() {
    var db_array = []
    for (var i of db) {
        db_array.push('.g div > a[href *= "' + i + '"]')
    }

    var UnexpectedSiteRemover = {
        currentUrl: {},
        constants: {
            queries: {
                result_links: db_array,
                link_parent_node: '#rso div.g',
                main_google_node: 'main'
            },
            events: {
                get_info: 'get_tId_and_wId',
                inactive: 'inactive',
                active: 'active'
            },
            console: {
                needs_to_be_updated: 'Filter Google Result selectors need to be updated!',
                removed: 'Filter Google Result links were removed from this search.'
            },
            observerConfig: { childList: true, subtree: true }
        },
        init: function() {
            var mainGoogleNode = document.getElementById(this.constants.queries.main_google_node);
            /* avoiding google new tab page and other variations */
            if (!mainGoogleNode) {
                return chrome.runtime.sendMessage({ event: this.constants.events.inactive, url: window.location.href });
            }
            chrome.runtime.sendMessage({ event: this.constants.events.get_info }, (info) => {
                var tId = info.tId;
                var wId = info.wId;
                this.currentUrl[wId] = this.currentUrl[wId] ? this.currentUrl[wId] : {};
                this.currentUrl[wId][tId] = window.location.href;
                this.remove(info);
                this.createResultsObserver(mainGoogleNode);
            });
        },
        getAllUnlikeSiteLinks: function() {
            const links = []
            this.constants.queries.result_links.forEach(function(linkTag) {
                links.push(...document.querySelectorAll(linkTag))
            })
            return links;
        },
        remove: function(info) {
            var tId = info.tId;
            var wId = info.wId;
            // ignoring dropdown items and huge card on the right
            var links = Array.from(this.getAllUnlikeSiteLinks()).filter(function(link) {
                var isAccordionItem = Boolean(link.closest('g-accordion-expander'))
                var isHugeCardOnTheRight = Boolean(link.closest('#wp-tabs-container'))
                return !isAccordionItem && !isHugeCardOnTheRight
            });
            var count = links.length;
            if (!count) {
                if (!this.isSameUrl(window.location.href, info)) {
                    chrome.runtime.sendMessage({ event: this.constants.events.inactive });
                    this.currentUrl[wId][tId] = window.location.href;
                }
                return;
            }
            this.currentUrl[wId][tId] = window.location.href;
            chrome.runtime.sendMessage({ event: this.constants.events.active, count: count });
            console.info(count + ' ' + this.constants.console.removed);
            links.forEach(this.deleteOldGrandpaNode.bind(this));
        },
        createResultsObserver: function(mainGoogleNode) {
            this.resultsObserver = new MutationObserver(() => {
                chrome.runtime.sendMessage({ event: this.constants.events.get_info }, info => {
                    var tId = info.tId;
                    var wId = info.wId;
                    this.currentUrl[wId] = this.currentUrl[wId] ? this.currentUrl[wId] : {};
                    this.remove(info);
                });
            });
            this.resultsObserver.observe(mainGoogleNode, this.constants.observerConfig);
        },
        isSameUrl: function(currentUrl, info) {
            var tId = info.tId;
            var wId = info.wId;
            return this.currentUrl[wId][tId] === currentUrl;
        },
        deleteOldGrandpaNode: function(el) {
            var parent = el.closest(this.constants.queries.link_parent_node);
            if (!parent) return console.warn(this.constants.console.needs_to_be_updated);
            parent.style.display = 'none';
        }
    };

    /* may need to tune this timeout in the future
    otherwise we get progressive removals instead of all them toghether */
    setTimeout(() => {
        UnexpectedSiteRemover.init();
    }, 250)

})();