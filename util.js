function isEmptyObject(obj) {
    var name;
    for (name in obj) {
        return false;
    }
    return true;
}

function lastElem(arr){
	return arr[arr.length - 1];
}

function readFile(path){
	var request= new XMLHttpRequest();
	request.overrideMimeType("application/text");
	request.open("GET", path, false);
	request.send(null);
	var returnValue= request.responseText;

	return returnValue;
}

// ..index.html?test=1 -> getQueryVariable("test") == "1"
function getQueryVar(variable){
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i=0;i<vars.length;i++){
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
    }
    return false;
}

function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

function tassert(condition, msg){
	if (!condition)
		alert("tassert: " + msg);
}
