/*global fetch, hideAllButCurrent, scrollToNavItem */

function initNav() {
    if (typeof scrollToNavItem !== "function") {
        return false;
    }
    scrollToNavItem();

    // hideAllButCurrent is not always loaded.
    if (typeof hideAllButCurrent === "function") {
        hideAllButCurrent();
    }
    return true;
}

function waitForNavJs() {
    var i = 0;

    function tryInit() {
        if (initNav()) {
            return;
        }
        if (i < 100) {
            i += 1;
            setTimeout(tryInit, 300);
            return;
        }
        console.error(new Error("nav.js not loaded after 30s waiting for it"));
    }

    tryInit();
}

function onNavResponse(response) {
    if (response.ok) {
        return response.text();
    }
    return (
        response.url + " => " +
        response.status + " " + response.statusText
    );
}

function onNavBody(body) {
    document.querySelector("nav").innerHTML += body;
    return initNav();
}

function onNavDone(done) {
    if (done) {
        return;
    }
    waitForNavJs();
}

function onNavError(error) {
    console.error(error);
}

if (typeof fetch === "function") {
    var navRequest = fetch("./nav.inc.html");
    navRequest = navRequest.then(onNavResponse);
    navRequest = navRequest.then(onNavBody);
    navRequest = navRequest.then(onNavDone);
    navRequest.catch(onNavError);
} else {
    console.error(
        new Error(
            "Browser too old to display commonNav " +
            "(remove commonNav docdash option)"
        )
    );
}
