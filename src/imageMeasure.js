'use strict';

function ImageMeasure(pdfKitDoc, imageDictionary) {
	this.pdfKitDoc = pdfKitDoc;
	this.imageDictionary = imageDictionary || {};
}

ImageMeasure.prototype.measureImage = function (src) {
	var image;
	var that = this;

	if (!this.pdfKitDoc._imageRegistry[src]) {
		try {
			image = this.pdfKitDoc.openImage(realImageSrc(src));
		} catch (error) {
			image = null;
		}
		if (image === null || image === undefined) {
			throw 'invalid image, images dictionary should contain dataURL entries (or local file paths in node.js)';
		}

        // calculate aspect ratio to make sure we dont distort the image
        image.aspectRatioH = image.height / image.width;
        image.aspectRatioW = image.width / image.height;

		image.embed(this.pdfKitDoc);
		this.pdfKitDoc._imageRegistry[src] = image;
	} else {
		image = this.pdfKitDoc._imageRegistry[src];
	}

    return { width: image.width, height: image.height, aspectRatioH: image.aspectRatioH, aspectRatioW: image.aspectRatioW };

	function realImageSrc(src) {
		var img = that.imageDictionary[src];

		if (!img) {
			return src;
		}

		var index = img.indexOf('base64,');
		if (index < 0) {
			return that.imageDictionary[src];
		}

		return Buffer.from(img.substring(index + 7), 'base64');
	}
};

module.exports = ImageMeasure;
