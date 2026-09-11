browser.commands.onCommand.addListener(async function(command) {
    const pinned = command.startsWith("switch-pinned-tab-");
    let idx = command.slice(-1) % 9 - 1;
    const tabs = await browser.tabs.query({
        currentWindow: true,
        hidden: false,
        pinned,
    });
    if (tabs.length <= idx) {
        idx = tabs.length - 1;
    }
    const tab = tabs.slice(idx);
    if (tab.length) {
        browser.tabs.update(tab[0].id, {active: true});
    }
});
