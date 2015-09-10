define([
    './tile',
    '../lightbox/lightbox'
], function(Tile, LightboxTile) {

    var TextTile = Tile.extend({

    	View: LightboxTile.View.extend({

            classes: Backbone.callParents("classes", function() {
                return [
                    "content"
                ];
            }),

            renderStyle: Backbone.callParents("renderStyle", function(styleObject) {

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
            })

        }),

        Model: LightboxTile.Model.extend({

            defaults: Backbone.callParents("defaults", function() {
                return {
                    "#showText": "true,true,true,true"
                };
            })
            
        })

    });

    Tile.register('text', TextTile);

    return TextTile;

});
