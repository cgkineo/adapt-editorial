define([
    'coreJS/adapt',
    '../tiles/tile',
    '../lib/jquery.resize',
    '../lib/jquery.backgroundImage'
], function(Adapt, Tile) {

    var LightboxTile = Tile.extend({
        View: Tile.View.extend({

            _disableAnimations: false,
            _lightboxOpen: false,
            _lightboxId: "",
            _lightboxBackground: false,
            _lightboxFullsize: false,
            _lightboxHasSized: false,
            _lightboxCurrentOffsetTop: 0,
            _lightboxCurrentAvailableHeight: 0,
            _animationDuration: 400,
            _windowDimensions: null,
            _forceResize: true,
            _iOS: /iPad|iPhone|iPod/.test(navigator.platform),

            onInitialize: Backbone.ascend("onInitialize", function() {
                var linkId = this.model.get("_linkId");
                if (!linkId) return;

                if (this._isIE8 || $('html').is(".ie8") || $('html').is(".iPhone.version-7\\.0")) {
                    this._disableAnimations = true;
                }

                if (linkId.indexOf("/") === -1) {
                    this.$el.addClass(linkId);
                } else {
                    this.$el.addClass("incomplete");
                }
                this.$el.attr("data-link", linkId);
            }),

            postRender: Backbone.ascend("postRender", function() {
                var linkId = this.model.get("_linkId");
                if (!linkId) return;

                this.onLinkClick = _.bind(this.onLinkClick, this);
                this.onCloseClick = _.bind(this.onCloseClick, this);

                this.$("button[data-link]").on("click", this.onLinkClick);
                
                switch (this.model.get("_type")) {
                case "video":
                    this.$(".text").on("click", this.onLinkClick);
                    break;
                case "text":
                case "image":
                    this.$el.on("click", this.onLinkClick);
                    break;
                }

                this.listenTo(Adapt, "lightbox:did-hide", this.onCloseClick);

                this.updateProgressBars();

            }),

            onLinkClick: function(event) {
                event.preventDefault();
                if (this._lightboxOpen) return;

                var linkId = this.model.get("_linkId");

                if (linkId.indexOf("/") > -1) {
                    window.open(linkId, "lightbox_resource");
                    this.$el.addClass("complete").removeClass("incomplete");
                    return;
                }

                this._editorialArticleView.$("[data-link='"+linkId+"']").addClass('visited');

                $('video,audio').trigger('pause');

                this._lightboxOpen = true;

                Adapt.trigger("lightbox:show", linkId);
            },

            onCloseClick: function(event) {
                if (!this._lightboxOpen) return;

                this.updateProgressBars();

                $('video,audio').trigger('pause');
                
                this._lightboxOpen = false;
                

            },

            updateProgressBars: function() {
                var linkId = this.model.get("_linkId");
                if (!linkId) return;

                if (linkId.indexOf("/") > -1) return;


                var linkModel = Adapt.findById(linkId);
                var componentModels = linkModel.findDescendants("components");
                componentModels = new Backbone.Collection(componentModels.where({
                    "_isAvailable": true
                }));

                var completeComponents = new Backbone.Collection(componentModels.where({
                    _isComplete: true
                }));

                var percentageComplete = 100;
                if (componentModels.length > 0) {
                    percentageComplete = (completeComponents.length / componentModels.length ) * 100;
                }

                if (percentageComplete == 0) {
                    this._editorialArticleView.$("[data-link='"+linkId+"']").removeClass("complete").addClass('incomplete');
                } else if (percentageComplete > 0 && percentageComplete < 100) {
                    this._editorialArticleView.$("[data-link='"+linkId+"']").removeClass("incomplete").addClass('partially-complete visited');
                } else if (percentageComplete == 100) {
                    this._editorialArticleView.$("[data-link='"+linkId+"']").removeClass("incomplete partially-complete").addClass('complete visited');
                }


                this._editorialArticleView.$("[data-link='"+linkId+"']").addClass()

                this._editorialArticleView.$("[data-link='"+linkId+"'] .lightbox-link-progress-bar").css({
                    "width": percentageComplete +"%"
                });

                if (Adapt.course.get("_globals") && Adapt.course.get("_globals")._extensions && Adapt.course.get("_globals")._extensions._editorial) {
                    var ariaLabel = Adapt.course.get("_globals")._extensions._editorial.progressIndicatorBar;
                    var ariaLabelInstructions = Adapt.course.get("_globals")._extensions._editorial.progressIndicatorBarIncompleteInstructions;
                    var $ariaLabel = this._editorialArticleView.$("[data-link='"+linkId+"'] .lightbox-link-progress-bar .aria-label");
                    $ariaLabel.html(ariaLabel + " " + percentageComplete + "%. " + (percentageComplete == 100 ? "" : ariaLabelInstructions));
                }
            },

            getCalculatedStyleObject: Backbone.ascend("getCalculatedStyleObject", function(styleObject) {
                var styleObject = this.model.toJSON();
                
                var linkId = this.model.get("_linkId");
                if (!linkId) return;
                
                switch (styleObject._linkStyle) {
                case "title":
                    this.$(".lightbox-link-title").removeClass("display-none")
                    this.$(".lightbox-link-center").addClass("display-none");
                    break;
                case "center":
                    this.$(".lightbox-link-title").addClass("display-none")
                    this.$(".lightbox-link-center").removeClass("display-none");
                    break;
                }
            }),

            onRemove: Backbone.descend("onRemove", function() {
                var linkId = this.model.get("_linkId");
                if (!linkId) return;
                
                this.stopListening(Adapt, "lightbox:close", this.onCloseClick);

                this.$("button[data-link]").off("click", this.onLinkClick);
                this.$(".text").off("click", this.onLinkClick);
                delete this.onLinkClick;
            })

        }),

        Model: Tile.Model.extend({

            defaults: Backbone.ascend("defaults", function() {
                return {
                    "_linkId": null,
                    "_linkText": null,
                    "_linkInstruction": null,
                    "_linkStyle": null,
                    
                };
            })

        })

    });

    return LightboxTile;

});

