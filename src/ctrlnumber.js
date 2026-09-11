let wanted = null;
let suppressUntil = 0;

async function activate(tab) {
    wanted = {id: tab.id, index: tab.index, windowId: tab.windowId};
    suppressUntil = Date.now() + 200;
    try {
        await browser.tabs.highlight({windowId: tab.windowId, tabs: [tab.index]});
    } catch (e) {
        await browser.tabs.update(tab.id, {active: true});
    }
}

function restoreWanted(windowId) {
    if (!wanted || Date.now() > suppressUntil) {
        wanted = null;
        return;
    }
    if (windowId !== undefined && windowId !== wanted.windowId) {
        return;
    }
    browser.tabs.highlight({windowId: wanted.windowId, tabs: [wanted.index]});
}

browser.commands.onCommand.addListener(async function(command) {
    const pinned = command.startsWith("switch-pinned-tab-");
    let idx = command.slice(-1) % 9 - 1;
    const tabs = (await browser.tabs.query({
        currentWindow: true,
        hidden: false,
        pinned,
    })).sort((a, b) => a.index - b.index);
    if (!tabs.length) {
        return;
    }
    if (idx < 0 || idx >= tabs.length) {
        idx = tabs.length - 1;
    }
    await activate(tabs[idx]);
});

// Firefox still binds Ctrl/Cmd+1–8 to "select the Nth tab", which is often
// pinned. That handler can run alongside this add-on and leave a highlight
// on the pinned tab without actually staying there.
browser.tabs.onHighlighted.addListener(function(info) {
    if (!wanted || Date.now() > suppressUntil) {
        return;
    }
    if (info.windowId !== wanted.windowId) {
        return;
    }
    if (info.tabIds.length === 1 && info.tabIds[0] === wanted.id) {
        return;
    }
    restoreWanted(info.windowId);
});

browser.tabs.onActivated.addListener(function(info) {
    if (!wanted || Date.now() > suppressUntil) {
        return;
    }
    if (info.tabId !== wanted.id) {
        restoreWanted(info.windowId);
    }
});
