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
