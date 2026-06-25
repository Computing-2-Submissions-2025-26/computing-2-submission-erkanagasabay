/*global NodeList */
// IE fix for browsers where NodeList.prototype.forEach is missing.
if (typeof NodeList.prototype.forEach !== typeof alert) {
    NodeList.prototype.forEach = Array.prototype.forEach;
}