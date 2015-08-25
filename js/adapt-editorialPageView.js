define([
    'coreJS/adapt',
    'coreViews/pageView'
], function(Adapt, PageView) {

    var EditorialView = {


    	addChildren: function() {
            var $lightbox = $(".lightbox-container .article-block-container");


            var linkIds = this.findDescendantsEditorialLinks();

            var nthChild = 0;
            var children = this.model.getChildren();
            var models = children.models;
            for (var i = 0, len = models.length; i < len; i++) {
                var model = models[i];
                nthChild ++;
                var ChildView = this.constructor.childView || Adapt.componentStore[model.get("_component")];
                if (model.get('_isAvailable')) {
                    var $parentContainer;
                    var $article = new ChildView({model:model}).$el;
                    
                    var isEditorialLightbox = model.get("_editorial") && model.get("_editorial")._isLightbox;
                    if (isEditorialLightbox) {
                        $parentContainer = $lightbox;
                        $article.attr("name", model.get("_id"));

                        var components = model.findDescendants("components");
                        _.each(components.models, function(component) {
                            if (component.get("_isQuestionType") && component.get("_feedback")) {
                                component.get("_feedback")._type = "overlay";
                            }
                        });
                    } else {
                        $parentContainer = this.$(this.constructor.childContainer);
                    }

                    model.set("_nthChild", nthChild);

                    $parentContainer.append($article);
                }
            }
        },

        findDescendantsEditorialLinks: function() {
            var children = this.model.getChildren();
            var models = children.models;
            var linkIds = [];
            for (var i = 0, len = models.length; i < len; i++) {
                var model = models[i];
                if (model.get("_editorial") && model.get("_editorial")._isEnabled) {

                    var articleLinkIds = _.pluck(model.get("_editorial")._tiles, "_linkId");
                    linkIds = linkIds.concat(articleLinkIds);

                }
            }
            linkIds = _.uniq(linkIds);
            console.log(linkIds);
        }

    };

    return EditorialView;
});