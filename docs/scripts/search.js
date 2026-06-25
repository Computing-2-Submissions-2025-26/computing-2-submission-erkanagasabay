/*global document, hideAllButCurrent */
var searchAttr = "data-search-mode";

function contains(node, match) {
    var text = node.textContent || node.innerText || "";
    return text.toUpperCase().indexOf(match) !== -1;
}

function setDisplay(selector, value) {
    var nodes = document.querySelectorAll(selector);
    var i = 0;
    while (i < nodes.length) {
        nodes[i].style.display = value;
        i += 1;
    }
}

function countMatchingLinks(parent, search) {
    var links = parent.querySelectorAll("a");
    var i = 0;
    var count = 0;

    while (i < links.length) {
        if (contains(links[i], search)) {
            count += 1;
        }
        i += 1;
    }
    return count;
}

function countUlMatchesAndVisible(parent, search) {
    var uls = parent.querySelectorAll("ul");
    var i = 0;
    var j;
    var countUl = 0;
    var countUlVisible = 0;
    var ulNode;
    var children;

    while (i < uls.length) {
        ulNode = uls[i];
        children = ulNode.children;
        j = 0;

        if (contains(ulNode, search)) {
            countUl += 1;
        }

        while (j < children.length) {
            if (children[j].style.display !== "none") {
                countUlVisible += 1;
            }
            j += 1;
        }
        i += 1;
    }

    return {
        countUl: countUl,
        countUlVisible: countUlVisible
    };
}

function updateParentVisibility(search) {
    var parents = document.querySelectorAll("nav > ul > li");
    var i = 0;
    var parent;
    var countSearchA;
    var counts;

    while (i < parents.length) {
        parent = parents[i];
        countSearchA = countMatchingLinks(parent, search);
        counts = countUlMatchesAndVisible(parent, search);

        if (countSearchA === 0 && counts.countUl === 0) {
            parent.style.display = "none";
        } else if (countSearchA === 0 && counts.countUlVisible === 0) {
            parent.style.display = "none";
        }
        i += 1;
    }
}

function updateCollapseTopVisibility() {
    var groups = document.querySelectorAll("nav > ul.collapse_top");
    var i = 0;
    var group;
    var children;
    var j;
    var countVisible;

    while (i < groups.length) {
        group = groups[i];
        children = group.querySelectorAll("li");
        j = 0;
        countVisible = 0;

        while (j < children.length) {
            if (children[j].style.display !== "none") {
                countVisible += 1;
            }
            j += 1;
        }

        if (countVisible === 0) {
            group.style.display = "none";
        }
        i += 1;
    }
}

function handleSearch(event) {
    var search = event.target.value.toUpperCase();
    var links;
    var i;

    if (!search) {
        document.documentElement.removeAttribute(searchAttr);
        setDisplay("nav > ul > li:not(.level-hide)", "block");

        if (typeof hideAllButCurrent === "function") {
            hideAllButCurrent();
            return;
        }

        setDisplay("nav > ul > li > ul li", "block");
        return;
    }

    document.documentElement.setAttribute(searchAttr, "");
    setDisplay("nav > ul > li", "block");
    setDisplay("nav > ul", "block");
    setDisplay("nav > ul > li > ul li", "none");

    links = document.querySelectorAll("nav > ul > li > ul a");
    i = 0;
    while (i < links.length) {
        if (contains(links[i].parentNode, search)) {
            links[i].parentNode.style.display = "block";
        }
        i += 1;
    }

    updateParentVisibility(search);
    updateCollapseTopVisibility();
}

document.getElementById("nav-search").addEventListener("keyup", handleSearch);
