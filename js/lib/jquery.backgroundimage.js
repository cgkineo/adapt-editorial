//https://github.com/cgkineo/jquery.backgroundImage 2015-08-18

;(function( $ ) {

    if ($.fn.backgroundImage) return;

    $.fn.backgroundImage = function(options) {

        options = options || {};
        if (options.dynamicRatio === undefined) options.dynamicRatio = false;
        if (options.expandContainerHeight === undefined) options.expandContainerHeight = true;
        if (options.expandHeight === undefined) options.expandHeight = undefined;
        if (options.selector === undefined) options.selector = "img";
        if (options.restrict === undefined) options.restrict = "auto auto";

        var $images = this.find(options.selector).add( this.filter(options.selector) );

        if ($images.length === 0) return;

        $images.each(function() {
            process($(this), options);
        });

    };

    function process($image, options) {
        var $offset = $image.parent();
        var $container = $offset.parent();
        var $containerParent = $container.parent();
        
        //reset image and offset
        $offset.css({
            "height": "",
            "width": "",
            "overflow": "hidden",
            "max-width": "100%",
            "max-height": "100%"
        });
        $image.css({
            "top": "",
            "left": "",
            "bottom": "",
            "right": "",
            "width": "",
            "height": "",
            "max-width": "100%",
            "max-height": "100%"
        });

        var imageDim = $image.getDimensions(options.dynamicRatio);

        //set/unset container height if required
        if (options.expandContainerHeight === true) {
            $container.css({
                "height": "100%"
            });
            if ($containerParent.height() > 0) {
                $container.css({
                    "height": $containerParent.height() + "px"
                });
            }
        } else if (options.expandContainerHeight === false) {
            $container.css({
                "height": ""
            });
        }

        var containerDim = $container.getDimensions(true);


        // set offset container to fill the width
        var offsetDimensions = {
            "width": "100%"
        };        
        
        /* only fill the height if asked in the settings or if the container height is larger than the offset height, 
        *  otherwise where content height is generated from the conent image, 
        *  100% height is meaningless before the image is in
        */
        if (containerDim.height > $offset.height() && offsetDimensions.height === undefined && options.expandHeight === undefined) {
            options.expandHeight = true;
            offsetDimensions.height = containerDim.height + "px";
        }
        //set offset style
        $offset.css(offsetDimensions);

        //capture body and container fontsize for rem and em calculations
        containerDim['fontSize'] = $container.css("font-size");
        var documentFontSize = $("body").css("font-size");
        
        //setup image for styling
        var imageDimensions = {
            "max-width": "none",
            "max-height": "none"
        };


        /* check the position variable to set the top left position of the image 
        *  inside it's overall container
        */
        var positionsDim;
        if (options.position !== undefined) {

            //setup image position styles for filling
            $.extend(imageDimensions, {
                "top": "",
                "left": "",
                "bottom": "",
                "right": ""
            });

            var positions = (options.position || "top left").split(" ");

            positionsDim = convertPositions(containerDim, imageDim, {
                "left": positions[0], 
                "top": positions[1], 
                "documentFontSize": documentFontSize
            });
            imageDimensions.top = positionsDim.top;
            imageDimensions.left = positionsDim.left;

        }

        //setup image size styles for filling
        if (options.size !== undefined) {
            $.extend(imageDimensions, {
                "width": "",
                "height": ""
            });
        }

        //setup image size (height / width);
        switch (options.size) {
        case undefined:
        case "contain":
            //default to contain if size is undefined, auto auto, or contain
            if (containerDim.ratio < imageDim.ratio) {
                var width = containerDim.width;
                imageDimensions.width = width + "px";
                imageDimensions.height = width / imageDim.ratio + "px"
            } else {
                var height = containerDim.height;
                imageDimensions.height = height + "px";
                imageDimensions.width = height * imageDim.ratio + "px"
            }
            break;

        case "cover":

            if (containerDim.ratio > imageDim.ratio) {
                var width = containerDim.width;
                imageDimensions.width = width + "px";
                imageDimensions.height = width / imageDim.ratio + "px"
            } else {
                var height = containerDim.height;
                imageDimensions.height = height + "px";
                imageDimensions.width = height * imageDim.ratio + "px"
            }
            break;

        default:
            //setup image value styles
            var sizes = (options.size || "100% auto").split(" ");
            var widthSize = sizes[0];
            var heightSize = sizes[1];

            var dims = convertDimensions(containerDim, imageDim, {
                "width": widthSize, 
                "height": heightSize,
                "documentFontSize": documentFontSize
            });

            imageDimensions.height = dims.height;
            imageDimensions.width = dims.width;

        }

        //correct any leftover styles with the image height/width if required
        if (imageDimensions.height === "auto") {
            imageDimensions.height = imageDim.height;
        }

        if (imageDimensions.width === "auto") {
            imageDimensions.width = imageDim.width;
        }

        //restrict the offset container (height/width) if required
        if (options.restrict !== undefined) {
            var restricts = options.restrict.split(" ");
            
            imageDimensions.ratio = imageDim.ratio;

            var dims = convertRestricts(containerDim, imageDimensions, {
                "width": restricts[0], 
                "height": restricts[1], 
                "documentFontSize": documentFontSize
            });

            offsetDimensions.width = dims.width;
            offsetDimensions.height = dims.height;

            $offset.css(offsetDimensions);
        }
        

        var offsetDim = $offset.getDimensions(true);

        //center, bottom or right align the image inside the offset container
        if (imageDimensions.top === "center") {
            var height = imageDimensions.height === undefined ? imageDim.height : parseInt(imageDimensions.height);
            imageDimensions.top = ((offsetDim.height / 2) - (parseFloat(height) / 2)) + "px";
        } else if (imageDimensions.top === "bottom") {
            var height = imageDimensions.height === undefined ? imageDim.height : parseInt(imageDimensions.height);
            imageDimensions.top = ((offsetDim.height) - (parseFloat(height))) + "px";
        }
        if (imageDimensions.left === "center") {
            var width = imageDimensions.width === undefined ? imageDim.width : parseFloat(imageDimensions.width);
            imageDimensions.left = ((offsetDim.width / 2) - (parseFloat(width) / 2)) + "px";
        } else if (imageDimensions.left === "right") {
            var width = imageDimensions.width === undefined ? imageDim.width : parseFloat(imageDimensions.width);
            imageDimensions.left = ((offsetDim.width) - (parseFloat(width))) + "px";
        }

        //apply the style
        $image.css(imageDimensions);
    }

    function arrayIndexOf(arr, value) {
        if (arr.indexOf) return arr.indexOf(value);
        for (var i = 0, l = arr.length; i < l; i++) {
            if (arr[i] == value) return i;
        }
        return -1;
    }

    function convertDimensions(container, image, settings) {
        var dim = {
            "width": 0,
            "height": 0
        };
        if (settings.width === undefined) settings.width = "auto";
        if (settings.height === undefined) settings.height = "auto";

        dim.width = convertDimension(container.width, settings.width, container.fontSize, settings.documentFontSize);
        dim.height = convertDimension(container.height, settings.height, container.fontSize, settings.documentFontSize);

        var autos = {
            "width": isAuto(dim.width),
            "height": isAuto(dim.height)
        };

        if (autos.width && autos.height) {
            if (container.ratio < image.ratio) {
                dim.width = container.width + "px";
                dim.height = (container.width / image.ratio) + "px"
            } else {
                dim.height = container.height + "px";
                dim.width = (container.height * image.ratio) + "px";
            }
        } else if (autos.width) {
            dim.width = (parseFloat(dim.height) * image.ratio) + "px";
        } else if (autos.height) {
            dim.height = (parseFloat(dim.width) / image.ratio) + "px";
        }

        return dim;

    }

    function convertDimension(containerValue, settingsValue, containerFontSize, documentFontSize) {
        if (isAuto(settingsValue)) {
            return "auto";
        } else if (isPercent(settingsValue)) {
            var val = parseFloat(settingsValue);
            return ((containerValue / 100) * val) + "px";
        } else if (isPixel(settingsValue)) {
            return parseFloat(settingsValue) + "px";
        } else if (isREM(settingsValue)) {
            return (documentFontSize * parseFloat(settingsValue)) + "px";
        } else if (isEM(settingsValue)) {
            return (containerFontSize * parseFloat(settingsValue)) + "px";
        }
        return "auto";
    }

    function convertPositions(container, image, settings) {
        var dim = {
            "left": 0,
            "top": 0
        };
        if (settings.left === undefined) settings.left = "left";
        if (settings.top === undefined) settings.top = "top";

        var swapped = false;
        switch (settings.left) {
        case "top": case "bottom":
            var a = settings.top;
            settings.top = settings.left;
            settings.left = a;
            swapped = true;
        }

        switch (settings.top) {
        case "left": case "right":
            if (!swapped) {
                var a = settings.top;
                settings.top = settings.left;
                settings.left = a;
                swapped = true;
            } else {
                settings.top = "top";
            }
        }

        dim.left = convertPosition(container.width, settings.left, container.fontSize, settings.documentFontSize);
        dim.top = convertPosition(container.height, settings.top, container.fontSize, settings.documentFontSize);

        if (dim.left === "auto") dim.left = "0px";
        if (dim.top === "auto") dim.top = "0px";

        return dim;
    }

    function convertPosition(containerValue, settingsValue, containerFontSize, documentFontSize) {
        if (isAuto(settingsValue)) {
            return "auto";
        } else if (isPercent(settingsValue)) {
            var val = parseFloat(settingsValue);
            return ((containerValue / 100) * val) + "px";
        } else if (isPixel(settingsValue)) {
            return parseFloat(settingsValue) + "px";
        } else if (isREM(settingsValue)) {
            return (documentFontSize * parseFloat(settingsValue)) + "px";
        } else if (isEM(settingsValue)) {
            return (containerFontSize * parseFloat(settingsValue)) + "px";
        }
        switch(settingsValue) {
        case "center":
            return "center";
        case "top":
            return "0px"
        case "left":
            return "0px"
        case "bottom":
            return "bottom";
        case "right":
            return "right";
        }
        return "auto";
    }

    function convertRestricts(container, image, settings) {
        var dim = {
            "width": 0,
            "height": 0
        };
        if (settings.width === undefined) settings.width = "auto";
        if (settings.height === undefined) settings.height = "auto";

        dim.width = convertDimension(container.width, settings.width, container.fontSize, settings.documentFontSize);
        dim.height = convertDimension(container.height, settings.height, container.fontSize, settings.documentFontSize);

        var autos = {
            "width": isAuto(dim.width),
            "height": isAuto(dim.height)
        };

        if (autos.width && autos.height) {
            dim.height = parseFloat(image.height) + "px";
            dim.width =  parseFloat(image.width) + "px";
        } else if (autos.width) {
            dim.width = parseFloat(image.width) + "px";
        } else if (autos.height) {
            dim.height = parseFloat(image.height) + "px";
        }

        return dim;

    }

    function isAuto(value) {
        return (/(auto){1}/gi).test(value);
    }

    function isRelative(value) {
        return (/^(\+|\-){1}/g).text(value);
    }

    function isPercent(value) {
        return (/\%{1}/g).test(value);
    }

    function isPixel(value) {
        return (/(px){1}/gi).test(value);
    }

    function isREM(value) {
        return (/(rem){1}/gi).test(value);
    }

    function isEM(value) {
        return (/(em){1}/gi).test(value);
    }
  

})( jQuery );
