define([
    'coreJS/adapt',
    'coreViews/articleView',
    'coreModels/articleModel',
    './adapt-editorialArticleView',
    './adapt-editorialArticleModel',
    './authoringmode/authoringMode',
    './adapt-editorialPageExtension',
    './tiles/tiles'
], function(Adapt, ArticleView, ArticleModel, ExtensionView, ExtensionModel, AuthoringMode) {

    var authoringModeEnabled = false;
    var $lightbox;

    Adapt.on("app:dataReady", function() {
        $lightboxDivs = $(Handlebars.templates['e-lightbox']({}));
        $("body").append($lightboxDivs);
        $lightbox = $lightboxDivs.filter(".lightbox-container");
    });
    /*  
        Here we are extending the articleView and articleModel in Adapt.
        This is to accomodate the new functionality on the article.
        The advantage of this method is that the extension behaviour can utilize all of the predefined article behaviour in both the view and the model.
    */  

    //Extends core/js/views/articleView.js
    var ViewInitialize = ArticleView.prototype.initialize;
    ArticleView.prototype.initialize = function(options) {
        if (this.model.get("_editorial") && this.model.get("_editorial")._isEnabled && !this.model.get("_editorial")._isLightbox) {
            //extend the articleView with new functionality
            _.extend(this, ExtensionView);
            this.$lightbox = $lightbox;
            if (this.model.get("_editorial")._isEnabled && this.model.get("_editorial")._authoringMode) {
                enableAuthoringMode();
            }
        }
        //initialize the article in the normal manner
        return ViewInitialize.apply(this, arguments);
    };

    //Extends core/js/models/articleModel.js
    var ModelInitialize = ArticleModel.prototype.initialize;
    ArticleModel.prototype.initialize = function(options) {
        if (this.get("_editorial") && this.get("_editorial")._isEnabled && !this.get("_editorial")._isLightbox) {
            //extend the articleModel with new functionality
            _.extend(this, ExtensionModel);

            //initialize the article in the normal manner
            var returnValue = ModelInitialize.apply(this, arguments);

            //post initialize article extension
            ExtensionModel.postInitialize.call(this);

            return returnValue;
        }

        //initialize the article in the normal manner if no extension
        return ModelInitialize.apply(this, arguments);
    };


    function enableAuthoringMode() {
        if (authoringModeEnabled) return;
        var model = new AuthoringMode.Model( this.model );
        var view = new AuthoringMode.View( {model:model} );
        $("body").append(view.$el);
        authoringModeEnabled = true;
    }

    

});