document.addEventListener("click", (e) => {
    var createData = {
        url: "../tabs/index.html",
    };
    var creating = browser.tabs.create(createData);
})