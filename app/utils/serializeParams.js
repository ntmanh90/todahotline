const serializeParams = function (obj) {
    var str = [];
    for (var p in obj)
        if (obj.hasOwnProperty(p)) {
            str.push((p) + "=" + (obj[p]));
        }
    return str.join("&");
};
export default serializeParams;
