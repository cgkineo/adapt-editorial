define([
    './tile',
    './lightbox'
], function(Tile, LightboxTile) {

    var TextTile = Tile.extend({

    	View: LightboxTile.View.extend({

            classes: Backbone.ascend("classes", function() {
                return [
                    "content"
                ];
            }),

            renderStyle: Backbone.descend("renderStyle", function(styleObject) {

                var textRoundedCorderColor = styleObject._textRoundedCornerColor || "";
                 this.$(".text").css({ 
                    "background-color": textRoundedCorderColor
                });

                var textBackgroundColor = styleObject._textBackgroundColor || "";
                this.$(".text .background").css({ 
                    "background-color": textBackgroundColor
                });

                var textTitleColor = styleObject._textTitleColor || "";
                this.$(".text .title").css({ 
                    "color": textTitleColor
                });

                var textTitleFontSize = styleObject._textTitleFontSize || "";
                this.$(".text .title").css({ 
                    "font-size": textTitleFontSize
                });

                var textBodyColor = styleObject._textBodyColor || "";
                this.$(".text .body").css({ 
                    "color": textBodyColor
                });

                var textInstructionColor = styleObject._textInstructionColor || "";
                this.$(".text .instruction").css({ 
                    "color": textInstructionColor
                });

                var textHeight = "";
                if (!textHeight && styleObject._fillHeight) {
                    var contentPadding = parseInt(this.$(".content").css("padding-bottom")) + parseInt(this.$(".content").css("padding-top"));
                    var tileInnerSpace = this.$el.innerHeight();
                    var textFillHeight = (tileInnerSpace - contentPadding);
                    textHeight = ( textFillHeight ) + "px";
                }
                this.$(".text").css({ 
                    height: textHeight
                });

            })

        }),

        Model: LightboxTile.Model.extend({

            defaults: Backbone.ascend("defaults", function() {
                return {
                    "#showText": "true,true,true,true"
                };
            })
            
        })

    });

    Tile.register('text', TextTile);

    return TextTile;

});
