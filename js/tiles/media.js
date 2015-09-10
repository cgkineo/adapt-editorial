define([
    'coreJS/adapt',
    './tile',
    '../lightbox/lightbox',
    '../lib/jquery.resize',
    '../lib/jquery.dimensions',
    '../lib/jquery.backgroundImage'
], function(Adapt, Tile, LightboxTile) {

    var MediaTile = Tile.extend({

        View: LightboxTile.View.extend({

            mediaSelector: ".media-item",

            classes: Backbone.callParents("classes", function() {
                return [
                    "media",
                    "content",
                    this.model.get("_linkId")
                ];
            }),

            getCalculatedStyleObject: Backbone.callParents("getCalculatedStyleObject", function() {
                var styleObject = this.model.toJSON();

                //set the ratio of text to media
                if (styleObject['_textPortion'] && (styleObject._textPosition == "left" || styleObject._textPosition == "right")) {
                
                    styleObject._textPortion = parseInt(styleObject._textPortion);
                    styleObject._mediaPortion = (100 - styleObject._textPortion) + "%";
                    styleObject._textPortion+="%";


                } else {
                    styleObject._mediaPortion = "";
                    styleObject._textPortion = "";
                }

                //space between text and media
                if (styleObject['_spaceBetween']) {
            
                    styleObject._textMargin = parseInt(styleObject._spaceBetween);
                   
                }

                return styleObject;
            }),

            renderStyle: Backbone.callParents("renderStyle", function(styleObject) {

                var contentHeight = styleObject._contentHeight ? styleObject._contentHeight+"px" : "";
                this.$(".content").css({ 
                    height: contentHeight
                });

                var textWidth = "";
                var textHeight = "";
                var textRoundedCorderColor = styleObject._textRoundedCornerColor || "";
                var textMargin = "";
                if (styleObject._textPosition=="left"||styleObject._textPosition=="right") {
                    textWidth = styleObject._textPortion || "";
                }
                if (styleObject._textPosition=="top"||styleObject._textPosition=="bottom") {
                    textHeight = styleObject._textPortion || ""
                }
                switch (styleObject._textPosition) {
                case "top":
                    textMargin = "0 0 " + styleObject._textMargin + "px 0";
                    break;
                case "left":
                    textMargin = "0 " + styleObject._textMargin + "px 0 0";
                    break;
                case "bottom":
                    textMargin = styleObject._textMargin + "px 0 0 0";
                    break;
                case "right":
                    textMargin = "0 0 0 " + styleObject._textMargin + "px";
                    break;
                }
                this.$(".text").css({ 
                    position: styleObject._offsetTop ? "absolute" : "",
                    bottom: styleObject._offsetTop ? "0px" : "",
                    width: textWidth,
                    height: textHeight,
                    margin: textMargin,
                    "background-color": textRoundedCorderColor
                });

                var mediaPortion = styleObject._hasText ? styleObject._mediaPortion || "" : "";
                this.$(".media").css({
                    width: mediaPortion
                });

                var textBackgroundColor = styleObject._textBackgroundColor || "";
                this.$(".text .background").css({ 
                    "background-color": textBackgroundColor
                });

                var textTitleColor = styleObject._textTitleColor || "";
                this.$(".text .title").css({ 
                    "color": textTitleColor
                });

                var textBodyColor = styleObject._textBodyColor || "";
                this.$(".text .body").css({ 
                    "color": textBodyColor
                });

                var textInstructionColor = styleObject._textInstructionColor || "";
                this.$(".text .instruction").css({ 
                    "color": textInstructionColor
                });

                this.checkIfTextIsBiggerThanImage();

                var size = (styleObject['_mediaSize'] || "auto auto");
                var position = (styleObject['_mediaPosition'] || "top left");
                var restrict = (styleObject['_mediaRestrict'] || "auto auto");
                var dynamicRatio = (styleObject['_mediaDynamicRatio'] === undefined ? true : styleObject['_mediaDynamicRatio']);

                this.$el.backgroundImage({
                    "size": size,
                    "position": position,
                    "restrict": restrict,
                    "selector": this.mediaSelector,
                    "dynamicRatio": dynamicRatio,
                    "expandContainerHeight": this.model.get("_textBigger")
                });

            }),

            checkIfTextIsBiggerThanImage: function() {
                var $text = this.$(".text");
                var $image = this.$(".media .media-item");

                switch (this.model.get("_textPosition")) {
                case "top": case "bottom":
                    this.model.set("_textBigger", false);
                    this.$el.attr("textbigger", "false");
                    return;
                case "left":
                    $text = $text.filter(".top");
                    break;
                case "right":
                    $text = $text.filter(".bottom");
                    break;
                }

                $text = $text.find(".text-inner");

                var textHeight = $text.outerHeight();
                var imageHeight = $image.outerHeight();

                var isTextBigger = textHeight > imageHeight;
                this.model.set("_textBigger", isTextBigger);
                this.$el.attr("textbigger", isTextBigger ? "true" : "false");
            }

        }),

        Model: LightboxTile.Model.extend({

            defaults: Backbone.callParents("defaults", function() {
                return {
                    "#showText": "true,true,true,true",
                    "#textPosition": "bottom,bottom,bottom,bottom",
                    "#textOverlay": "false,false,false,false",
                    "#textRounded": "false,false,false,false",
                    "#textPortion": "40%,40%,40%,40%",
                    /*"#textBackgroundColor":"rgb(127,127,127),rgb(127,127,127),rgb(127,127,127)",
                    "#textRoundedCorderColor":"rgb(0,0,0),rgb(0,0,0),rgb(0,0,0)",
                    "#spaceBetween": "0,0,0,0",*/
                    "#mediaSize": "cover,cover,cover,cover",
                    "#mediaRestrict": "100% auto,100% auto,100% auto,100% auto",
                    "#mediaPosition": "center center,center center,center center,center center",
                    "#mediaDynamicRatio": "false,false,false,false"
                };
            })
            
        })

    });

    return MediaTile;

});
