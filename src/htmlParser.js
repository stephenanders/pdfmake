/* jslint node: true */
'use strict';

// var Highcharts = require('highcharts');
// var canvg = require('canvg');
// var rgbcolor = require('rgbcolor');
// var svgToDataUrl = require('svg-toDataUrl');
var pxToPt = require('./helpers').pxToPt;

//
//Adapted from code in this Stack Overflow answer: http://stackoverflow.com/a/31648306/470360
//
function HtmlParser() {
	this.highcharts = null;
	this.definedStyles = {};
	this.parsedResult = {

	};
}

HtmlParser.prototype.parseHTML = function (elements, styles) {
    this.definedStyles = styles || {};

    if (typeof (elements) === 'string') {
        var parser = new DOMParser();
        var doc = parser.parseFromString(elements.replace(/\t/g, '').replace(/\n/g, ''), 'text/html');
        elements = doc.childNodes;
    }

    var parsedResult = [];
    var p = this.createParagraph();
    for (var i = 0, l = elements.length; i < l; i++) {
        this.parseElement(parsedResult, elements[i], p);
    }

    return parsedResult;
}

HtmlParser.prototype.createParagraph = function () {
	return {text:[]};
}

//passing in parent styles to apply to child elements
//typically dont need to pass in parent classes - only for TR elements which parse as arrays
HtmlParser.prototype.parseContainer = function (cnt, el, p, styles, classes) {
	var parsedContent = [];
	var children = el.childNodes;
	var element, thead, tfoot;
	if (children.length != 0) {
	    for (var i = 0; i < children.length; i++) {
	        element = children[i];
			//pass in a copy of the style array so child styles dont affect the parent
	        p = this.parseElement(parsedContent, element, p, styles.slice(0), (classes ? classes.slice(0) : undefined));
				
	        if (parsedContent.length != 0) {
	            switch (element.nodeName.toLowerCase()) {
	                case 'caption': {
	                    cnt.caption = parsedContent[0];
	                    parsedContent = [];
	                    p = this.createParagraph();
	                    break;
	                }
	                case 'thead': {
	                    thead = parsedContent;
	                    parsedContent = [];
	                    p = this.createParagraph();
	                    break;
	                }
	                case 'tfoot': {
	                    tfoot = parsedContent;
	                    parsedContent = [];
	                    p = this.createParagraph();
	                    break;
	                }
	                case 'tbody': {
	                    if (thead != null) {
	                        parsedContent = thead.concat(parsedContent)
	                    }
	                    break;
	                }
	            }
			}
		}
	}
	if (parsedContent.length != 0) {
		if(el.nodeName.toLowerCase()=='table') {
		    Array.prototype.push.apply(cnt.body, parsedContent);
		    if (tfoot != null) {
		        Array.prototype.push.apply(cnt.body, tfoot);
		    }
		} else {
		    Array.prototype.push.apply(cnt, parsedContent);
		}
	}
	return p;
}

HtmlParser.prototype.applyCSSClasses = function (o, classes){
	if(classes.length>0){
		var styles = [];
		for (var i = 0; i < classes.length; i++) {
			styles.push(classes[i]);
		}
		if (styles.length > 0) o.style = styles;
	}
}

HtmlParser.prototype.computeStyle = function (o, styles) {
	var idxHeight = -1;
	for (var i = 0; i < styles.length; i++) {
		var st = styles[i].trim().toLowerCase().split(':');
		if (st.length == 2) {
			switch (st[0]) {
				case 'text-align': {
					switch (st[1]) {
						case 'right': o.hAlign = 'right'; break;
						case 'center': o.hAlign = 'center'; break;
					}
					break;
				}
				case 'vertical-align': {
					switch (st[1]) {
						case 'bottom': o.vAlign = 'bottom'; break;
						case 'middle': o.vAlign = 'middle'; break;
					}
					break;
				}
				case 'height':{
					if(/px$/.test(st[1])){
						o.height = pxToPt(parseFloat(st[1]));
					} else {
						o.height = parseFloat(st[1]);
					}
					idxHeight = i;
					break;
				}
				case 'font-size':{
					if(/px$/.test(st[1])){
						o.fontSize = parseFloat(pxToPt(parseFloat(st[1])));
					} else {
						o.fontSize = parseFloat(st[1]);
					}
					break;
				}
				case 'font-weight': {
					switch (st[1]) {
						case 'bold': o.bold = true; break;
					}
					break;
				}
				case 'text-decoration': {
					switch (st[1]) {
						case 'underline': o.decoration = 'underline'; break;
					}
					break;
				}
				case 'font-style': {
					switch (st[1]) {
						case 'italic': o.italics = true; break;
					}
					break;
				}
				case 'color':{
					o.color = '' + st[1];
					break;
				}
				// case 'white-space':{
				// 	switch (st[1]) {
				// 		case 'nowrap': o.noWrap = true; break;
				// 	}
				// 	break;
				// }

				// case 'margin-left':{
				// 	if(/px$/.test(st[1])){
				// 		o.marginLeft = parseFloat(pxToPt(parseFloat(st[1])));
				// 	} else {
				// 		o.marginLeft = parseFloat(st[1]);
				// 	}
				// 	break;
				// }
				// case 'margin-right':{
				// 	if(/px$/.test(st[1])){
				// 		o.marginRight = parseFloat(pxToPt(parseFloat(st[1])));
				// 	} else {
				// 		o.marginRight = parseFloat(st[1]);
				// 	}
				// 	break;
				// }
				// case 'margin-top':{
				// 	if(/px$/.test(st[1])){
				// 		o.marginTop = parseFloat(pxToPt(parseFloat(st[1])));
				// 	} else {
				// 		o.marginTop = parseFloat(st[1]);
				// 	}
				// 	break;
				// }
				// case 'margin-bottom':{
				// 	if(/px$/.test(st[1])){
				// 		o.marginBottom = parseFloat(pxToPt(parseFloat(st[1])));
				// 	} else {
				// 		o.marginBottom = parseFloat(st[1]);
				// 	}
				// 	break;
				// }
			}
		}
	}
	//remove height so it only applies once
	if (idxHeight > -1) {
		styles.splice(i, 1);
	}
}

HtmlParser.prototype.parseCSSClasses = function (el, classes) {
	var className = el.getAttribute('class');
	if (className) {
		var cl = className.split(' ');
		for (var k = 0; k < cl.length; k++) {
			//if it is a defined class and we dont already have it, add to the list
			if(cl[k] in this.definedStyles && classes.indexOf(cl[k]) == -1 && !cl[k].match(/^mso/i)){
				classes.push(cl[k]);
			}
		}
	}
}

HtmlParser.prototype.parseInlineStyle = function (el, styles){
	var nodeStyle = el.getAttribute('style');
	if (nodeStyle) {
		var ns = nodeStyle.split(';');
		for (var k = 0; k < ns.length; k++) {
			if (ns[k].trim() != '' && !ns[k].match(/^mso-/i)) styles.push(ns[k]);
		}
	}
}

HtmlParser.prototype.parseElement = function (cnt, el, p, styles, classes) {
	if (!styles) styles = [];
	if (!classes) classes = [];
	
	if (this.isVisible(el)) {
		if (el.getAttribute) {
			this.parseCSSClasses(el, classes);
			this.parseInlineStyle(el, styles);
		}
		var nodeName = el.nodeName.toLowerCase();
		switch (nodeName) {
			case '#comment':{
				//skip comments
				break;
			}
			case '#text': {
				var t = { text: el.textContent.replace(/^\s+|\s+$|\n/g, '') + ' ' };
				if(t.text.trim() != ''){
					if (classes) this.applyCSSClasses(t, classes);
					if (styles) this.computeStyle(t, styles);
					p.text.push(t);
				}
				break;
			}
			case 'b':case 'strong': {
				this.parseContainer(cnt, el, p, styles.concat(['font-weight:bold']));
				break;
			}
			case 'u': {
				this.parseContainer(cnt, el, p, styles.concat(['text-decoration:underline']));
				break;
			}
			case 'i':case 'em': {
				this.parseContainer(cnt, el, p, styles.concat(['font-style:italic']));
				break;
			}
			case 'sup': {
				this.parseContainer(cnt, el, p, styles.concat(['vertical-align:super']));
				break;
			}
			case 'span': {
				this.parseContainer(cnt, el, p, styles);
				break;
			}
			case 'br': {
				if(p.text.length == 0){
					p = this.createParagraph();
					cnt.push(p);
				} else {
					p.text.push('\n');
				}
				break;
			}
			case 'hr': {
				cnt.push({ canvas: [{ type: 'line', x1: 0, y1: 5, x2: 595 - 2 * 40, y2: 5, lineWidth: 0.5 }] })
			}
			case 'table':{
				var t = {
					table: {
						caption: {},
						widths: [],
						heights: [],
						body: []
					}
				}
				var border = el.getAttribute('border');
				var isBorder = false;
				if (border) if (parseInt(border) == 1) isBorder = true;
				if (!isBorder) t.layout = 'noBorders';
					
				if (classes) this.applyCSSClasses(t, classes);
				this.parseContainer(t.table, el, p, styles);

				var widths = el.getAttribute('widths');
				if (!widths) {
					if (t.table.body.length != 0) {
						if (t.table.body[0].length != 0) for (var k = 0; k < t.table.body[0].length; k++) t.table.widths.push('*');
					}
				} else {
					var w = widths.split(',');
					while(w.length < t.table.body[0].length) {
						w.push(w[w.length - 1]);
					}
						
					Array.prototype.push.apply(t.table.widths, w);
				}
				var heights = el.getAttribute('heights');
				if (!heights) {
					if (t.table.body.length != 0) {
						for (var k = 0; k < t.table.body.length; k++) t.table.heights.push('*');
					}
				} else {
					var h = heights.split(',');
					Array.prototype.push.apply(t.table.heights, h);
				}
				if (t.table.body.length > 0) {
					cnt.push(t);
				}
				break;
			}
			case 'caption': {
				p = this.createParagraph();
				var node = {stack: []};
				node.stack.push(p);

				if(classes) this.applyCSSClasses(node, classes);
				if(styles) this.computeStyle(node, styles);

				this.parseContainer(node.stack, el, p, styles);

				cnt.push(node);
				break;
			}
			case 'thead':
			case 'tfoot':
			case 'tbody': {
				this.parseContainer(cnt, el, p, styles);
				break;
			}
			case 'tr': {
				var row = [];
					
				//tr goes in as an array - dont apply styles and classes, pass them down to child elements
				this.parseContainer(row, el, p, styles, classes);
				cnt.push(row);
				break;
			}
			case 'td':
			case 'th': {
				p = this.createParagraph();
				var node = {stack: []}
				node.stack.push(p);

				if (classes) this.applyCSSClasses(node, classes);
				if (styles) this.computeStyle(node, styles);
					
				this.parseContainer(node.stack, el, p, styles);

				var cspan = el.getAttribute('colspan');
				if (cspan) node.colSpan = parseInt(cspan);
				var rspan = el.getAttribute('rowspan');
				if (rspan) node.rowSpan = parseInt(rspan);

				cnt.push(node);

				if (node.colSpan > 1) {
					for (var i = 1; i < node.colSpan; i++){
						// pdfMake needs empty cells to account for the colSpans
						//node.stack.push(this.createParagraph());
						this.addEmptyNode(cnt);
					}
				}

				if (node.rowSpan > 1) {
					//TODO: need to figure how to add empty cells for rowSpans
				}
				break;
			}
			case 'div':
			case 'p': {
				p = this.createParagraph();
				var node = {stack: []};
				node.stack.push(p);
					
				if (classes) this.applyCSSClasses(node, classes);
				if (styles) this.computeStyle(node, styles);
					
				this.parseContainer(node.stack, el, p, styles);

				cnt.push(node);
				break;
			}
			case 'a': {
				p = this.createParagraph();
				var node = { stack: [] };
				node.stack.push(p);

				var href = el.getAttribute('href');
				node.link = href;

				if (classes) this.applyCSSClasses(node, classes);
				if (styles) this.computeStyle(node, styles);

				this.parseContainer(node.stack, el, p, styles);

				cnt.push(node);
				break;
			}
			case 'chart': {
				if (window) {
					var highcharts = window.Highcharts || window.hcharts;
					if (highcharts) {
						var cht = highcharts.charts[el.getAttribute('data-highcharts-chart')];
						var svgTxt = cht.getSVG();
						var dom = new DOMParser();
						var svgEl = dom.parseFromString(svgTxt, 'image/svg+xml').documentElement;
						
						var pngTxt = svgEl.toDataUrl('image/png'); //, {callback: this.callbackSvgToPng});

						var node = { image: pngTxt, height: svgEl.height };

						cnt.push(node);
					}
				}
				break;
			}
			case 'img': {
				var src = '' + el.getAttribute('src');
				var imgTxt = '';

				// if (src.match(/\.svg$/)){
				// 	imgTxt = img.toDataUrl('image/png', {callback: this.callbackSvgToPng});
				// } else {
				imgTxt = this.imgToDataUrl(el);
				// }
				
				var node = { image: imgTxt, height: pxToPt(el.height) };
				cnt.push(node);

				break;
			}
			case 'ul':
			case 'ol': {
				p = this.createParagraph();
				var node = { };
				node[nodeName] = [p];

				if (classes) this.applyCSSClasses(node, classes);
				if (styles) this.computeStyle(node, styles);
					
				this.parseContainer(node[nodeName], el, p, styles.concat(['margin-left:20px','margin-top:10px','margin-bottom:10px']));

				cnt.push(node);
				break;
			}
			case 'li': {
				p = this.createParagraph();
				var node = {stack: []};
				node.stack.push(p);
					
				if (classes) this.applyCSSClasses(node, classes);
				if (styles) this.computeStyle(node, styles);
					
				this.parseContainer(node.stack, el, p, styles);

				cnt.push(node);
				break;
			}
			default: {
				// no output defined for this element, but it is visible... 
				// if it has children, just keep parsing
				if(el.children && el.children.length > 0) {
					this.parseContainer(cnt, el, p, styles);
				} else {
					console.log('HtmlParser definition for node \'' + el.nodeName + '\' not found');
				}
				break;
			}
		}
	// } else {
	// 	console.log(el.nodeName + ' node not visible.  id: ' + (el.id || '') + ', class: ' + (el.className || ''));
	}
	return p;
}

HtmlParser.prototype.addEmptyNode = function(cnt) {
	var p = this.createParagraph();
	var node = {stack: []}
	node.stack.push(p);

	cnt.push(node);
}

HtmlParser.prototype.imgToDataUrl = function(img) {
		// Create an empty canvas element
		var canvas = document.createElement("canvas");
		canvas.width = img.width; //or img.naturalWidth;
		canvas.height = img.height; //or img.naturalHeight;
	
		// Copy the image contents to the canvas
		canvas.getContext("2d").drawImage(img, 0, 0);
	
		// Get the data-URL formatted image
		// Firefox supports PNG and JPEG. You could check img.src to
		// guess the original format, but be aware the using "image/jpg"
		// will re-encode the image.
		var dataURL = canvas.toDataURL("image/png");

		// return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
		return dataURL;
}

HtmlParser.prototype.isVisible = function (el) {
	return !!( el.offsetWidth || el.offsetHeight || (el.getclientRects && el.getClientRects().length || el.attributes && !!(el.attributes['pdfvisible']) || ['#text','br'].indexOf(el.nodeName.toLowerCase()) > -1) );
}

// HtmlParser.prototype.callbackSvgToPng = function(dataUrl) {
// 	return dataUrl;
// }

module.exports = {
    parseHTML: function(elements, styles) {
        return new HtmlParser().parseHTML(elements, styles);
    }
}