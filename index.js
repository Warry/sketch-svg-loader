var fs = require('fs'),
    parse = require('./lib/parse');

function cleanAttributes(attributes) {
  for (var k in attributes){
    if (k.indexOf(":sketch") > 0) delete attributes[k]
    else if (k.indexOf("sketch:") == 0) delete attributes[k]
    else if (k == "id") {
      // If layer names is a class name, then add [class]
      if (attributes[k][0] == ".") {
        attributes["class"] = attributes[k].replace(/\./, " ")
      }
      // removes all ID attributes
      delete attributes[k]
    }
  }
  return attributes;
}

var blacklist = ["title", "desc", "defs"];
function cleanTag(tag) {
  // Remve Sketch page wrapper... useless
  if (tag.attrs && tag.attrs.id && tag.attrs.id.indexOf("Page-") == 0) return clean(tag.children);
  // remove black listed tags
  if (tag.name && blacklist.indexOf(tag.name) >= 0) return void 0;
  // remove comments
  else if (tag.comment) return void 0;
  // Clean attributes
  if (tag.attrs) tag.attrs = cleanAttributes(tag.attrs)
  // Recurively clean children
  if (tag.children) tag.children = clean(tag.children)
  return tag;
}

function clean(node) {
  var ret = [];
  for (var i in node){
    var tag = cleanTag(node[i])
    if ({}.toString.call(tag) == '[object Array]') return tag;
    else if (tag) ret.push(tag);
  }
  return ret;
}

function nodeToVdom(n){
  if (n.children)
    return 'svg("'+n.name+'", '+JSON.stringify(n.attrs)+', ['+n.children.map(nodeToVdom).join(',')+'])'
  else
    return 'svg("'+n.name+'", '+JSON.stringify(n.attrs)+')'
}

function toVdom(o) {
  var output = []
  output.push('var svg = require("virtual-dom/virtual-hyperscript/svg");')
  output.push("module.exports = "+ nodeToVdom(o[0])) +";"

  return output.join("\n")
}

module.exports = function(content) {
  this.cacheable && this.cacheable();
  var callback = this.async();
  parse(content, function (err, result) {
    var parsed = clean(result);
    callback(null, toVdom(parsed));
  });

}


