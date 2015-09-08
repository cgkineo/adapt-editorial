define([
    'coreJS/adapt',
    './media'
], function(Adapt, Media) {

    var ImageTile = { 

        View: Media.View.extend({

            checkReadyStatus: function() {
                if (this.$("img").length > 0) this.$el.imageready(_.bind(this.setReadyStatus, this), { allowTimeout: false });
                else this.setReadyStatus.call(this);
            }

        }),

        Model: Media.Model.extend({})

    };

    Media.register('image', ImageTile);

    return ImageTile;

});
