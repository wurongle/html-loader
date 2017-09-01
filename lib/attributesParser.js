/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var Parser = require("fastparse");

var processMatch = function (match, strUntilValue, name, value, index) {
	if (!this.isRelevantTagAttr(this.currentTag, name)) return;

	if (name.toLowerCase() == 'style') {
		parseStyle(value, strUntilValue.length + index, this);
		return;
	}
	if (name.toLowerCase() == 'srcset') {
		console.log(match, strUntilValue, value)
		parserSrcset(value, strUntilValue.length + index, this);
		return;
	}

	this.results.push({
		start: index + strUntilValue.length,
		length: value.length,
		value: value
	});
};

var parseStyle = function (content, startIndex, parserContext) {
	var index = 0;
	content.replace(/(.*?url\((['"]?))([^)]*)\2\)/ig, function (match, strUntilValue, abc, value) {
		parserContext.results.push({
			start: index + startIndex + strUntilValue.length,
			length: value.length,
			value: value
		});
		index = match.length;
	})
}

var parserSrcset = function (content, startIndex, parserContext) {
	var list = content.split(/,/),
		index = 0,
		value = '';

	list.forEach(function (element, i) {
		if (i > 0) {
			index = (function () {
				var len = 0;
				while (i > 0) {
					len += list[--i].length + 1;
				}
				return len;
			})();
		}
		element = element.replace(/^(\s+)/, function (m, a, b) {
			index = index + m.length;
			return '';
		});
		value = element.split(/\s+/)[0];
		parserContext.results.push({
			start: startIndex + index,
			length: value.length,
			value: value
		});
	});
}

var parser = new Parser({
	outside: {
		"<!--[\\s\\S]*?-->": true,
		"<![CDATA[[\\s\\S]*?]]>": true,
		"<[!\\?].*?>": true,
		"<\/[^>]+>": true,
		"<([a-zA-Z\\-:]+)\\s*": function (match, tagName) {
			this.currentTag = tagName;
			return "inside";
		}
	},
	inside: {
		"\\s+": true, // eat up whitespace
		">": "outside", // end of attributes
		"(([0-9a-zA-Z\\-:]+)\\s*=\\s*\")([^\"]*)\"": processMatch,
		"(([0-9a-zA-Z\\-:]+)\\s*=\\s*\')([^\']*)\'": processMatch,
		"(([0-9a-zA-Z\\-:]+)\\s*=\\s*)([^\\s>]+)": processMatch
	}
});

module.exports = function parse(html, isRelevantTagAttr) {
	return parser.parse("outside", html, {
		currentTag: null,
		results: [],
		isRelevantTagAttr: isRelevantTagAttr
	}).results;
};
