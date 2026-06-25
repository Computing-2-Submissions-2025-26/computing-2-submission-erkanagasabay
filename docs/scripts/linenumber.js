/*global document */

function applyLineNumbers() {
    var source = document.getElementsByClassName("prettyprint source linenums");
    var i = 0;
    var lineNumber = 0;
    var lineId;
    var lines;
    var totalLines;
    var anchorHash;

    if (source && source[0]) {
        anchorHash = document.location.hash.substring(1);
        lines = source[0].getElementsByTagName("li");
        totalLines = lines.length;

        while (i < totalLines) {
            lineNumber += 1;
            lineId = "line" + lineNumber;
            lines[i].id = lineId;
            if (lineId === anchorHash) {
                lines[i].className += " selected";
            }
            i += 1;
        }
    }
}

applyLineNumbers();
