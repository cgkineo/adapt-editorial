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
            _lightboxBlockId: "",
            _lightboxBackground: false,
            _lightboxFullsize: false,
            _lightboxHasSized: false,
            _lightboxCurrentOffsetTop: 0,
            _lightboxCurrentAvailableHeight: 0,
            _animationDuration: 400,
            _windowDimensions: null,
            _forceResize: true,

            onInitialize: Backbone.callParents("onInitialize", function() {
                var linkId = this.model.get("_linkId");
                if (!linkId) return;

                if (this._isIE8 || $('html').is(".ie8") || $('html').is(".iPhone.version-7\\.0")) {
                    this._disableAnimations = true;
                }

                this.$el.addClass(linkId);
                this.$el.attr("data-link", linkId);

                this.updateProgressBars();
            }),

            getCalculatedStyleObject: Backbone.callParents("getCalculatedStyleObject", function(styleObject) {
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


            postRender: Backbone.callParents("postRender", function() {
                var linkId = this.model.get("_linkId");
                if (!linkId) return;

                this._onLinkClick = _.bind(this.onLinkClick, this);
                this._onCloseClick = _.bind(this.onCloseClick, this);
                this._resizeLightbox = _.bind(this.resizeLightbox, this);

                var $lightboxContainer = this._editorialArticleView.$lightbox;

                this.$("button[data-link]").on("click", this._onLinkClick);
                this.$(".text").on("click", this._onLinkClick);
                $lightboxContainer.find(".close-button").on("click", this._onCloseClick);

            }),

            onLinkClick: function(event) {
                if (this._lightboxOpen) return;

                $('video,audio').trigger('pause');

                if (!this._disableAnimations) {
                    $(".lightbox-loading").velocity({"opacity":1},{"duration":0}).show();
                } else {
                    $(".lightbox-loading").css({
                        "display": "block"
                    });
                }

                this._lightboxHasSized = false;
                this._lightboxCurrentOffsetTop = 0;
                this._lightboxCurrentAvailableHeight = 0;

                var $lightboxContainer = this._editorialArticleView.$lightbox;
                var $lightboxPopup = $lightboxContainer.find(".lightbox-popup");
                var $backgroundImage = $lightboxContainer.find(".background-image");
                var $article = $lightboxContainer.find('[name="'+this.model.get("_id")+'"]');
                var $button = $(event.currentTarget);
                
                this._lightboxBlockId = $button.attr("data-link");

                var $block = $lightboxContainer.find("."+this._lightboxBlockId);
                var blockModel = Adapt.findById(this._lightboxBlockId);

                this._lightboxBackground = blockModel.get("_background");

                $article.css({
                    "display": "block"
                }).siblings().css({
                    "display": "none"
                });

                $block.css({
                    "display": "block"
                }).siblings().css({
                    "display": "none"
                });

                $(window).resize();
                $(window).on("resize", this._resizeLightbox);

                if (!this._disableAnimations) {
                    $lightboxContainer.css({
                        "opacity": 0,
                        "visibility": "visible"
                    });
                } else {
                    $lightboxContainer.css({
                        "visibility": "hidden"
                    });
                }

                if (this._lightboxBackground) {
                    $lightboxPopup.addClass("has-background");
                    $backgroundImage.find("img").attr("src", this._lightboxBackground._src);
                    $backgroundImage.imageready(_.bind(complete, this));
                } else {
                    $lightboxPopup.removeClass("has-background");
                    $backgroundImage.find("img").attr("src", "");
                    complete.call(this);
                }

                function complete() {
                    this._lightboxOpen = true;

                    this._forceResize = true;
                    this.resizeLightbox();

                    _.defer(_.bind(function() {


                        $lightboxPopup.on("resize", this._resizeLightbox);

                        if (!this._disableAnimations) {

                            $lightboxContainer.velocity({
                                "opacity": 1
                            },{
                                "delay": 100,
                                "duration": this._animationDuration
                            });

                        } else {

                            $lightboxContainer.css({
                                "visibility": "visible"
                            });

                        }                

                        Adapt.trigger('popup:opened',$lightboxPopup);
                        $('body').scrollDisable();

                    }, this));
                }

            },

            resizeLightbox: function() {
                if (!this._lightboxOpen) return;
                if (!this._forceResize && !$(window).haveDimensionsChanged(this._windowDimensions)) return;

                this._windowDimensions = $(window).getDimensions(true);

                this._forceResize = false;

                var $lightboxContainer = this._editorialArticleView.$lightbox;
                var $block = $lightboxContainer.find("."+this._lightboxBlockId);
                var $lightboxPopup = $lightboxContainer.find(".lightbox-popup");
                var $backgroundImage = $lightboxContainer.find(".background-image");
                var $backgroundImageTag = $backgroundImage.find("img");

                var blockHeight = $block.outerHeight();
                var availableHeight = $lightboxContainer.height();
                var navigationHeight = $(".navigation").outerHeight();
                var contentMiddle = (availableHeight) / 2;
                var blockOffsetTop = (contentMiddle - (blockHeight / 2));

                $backgroundImage.backgroundImage({
                    "size": this._lightboxBackground._size,
                    "position": this._lightboxBackground._position,
                    "restrict": this._lightboxBackground._restrict
                });

                if (this._lightboxHasSized && this._lightboxCurrentAvailableHeight === availableHeight) {
                    if (this._lightboxFullsize) return;
                    if (!this._lightboxFullsize && availableHeight >= this._lightboxCurrentOffsetTop + blockHeight) return;
                }

                this._lightboxHasSized = true;
                this._lightboxFullsize = false;
                this._lightboxCurrentOffsetTop = blockOffsetTop;
                this._lightboxCurrentAvailableHeight = availableHeight;

                if (availableHeight < blockHeight) {
                    $lightboxPopup.css({
                        "top": "0px",
                        "bottom": "0px",
                        "overflow-y": "scroll"
                    });
                    this._lightboxFullsize = true;
                    return;
                }

                $block.css({
                    "min-height": "100%"
                })
                
                $lightboxPopup.css({
                    "top": blockOffsetTop + "px",
                    "bottom": "",
                    "overflow-y": "hidden"
                });

            },

            onCloseClick: function(event) {
                if (!this._lightboxOpen) return;

                this.updateProgressBars();

                if (this._resizeLightbox) $(window).off("resize", this._resizeLightbox);

                $('video,audio').trigger('pause');
                
                this._lightboxOpen = false;
                
                var $lightboxContainer = this._editorialArticleView.$lightbox;
                var $lightboxPopup = $lightboxContainer.find(".lightbox-popup");

                $lightboxPopup.off("resize", this._resizeLightbox);



                if (!this._disableAnimations) {  

                    var $anim = $($lightboxContainer).add($(".lightbox-loading"));

                    $anim.velocity("stop").velocity({
                        "opacity": 0
                    },{
                        "duration": this._animationDuration,
                        "complete": complete
                    });                 

                } else {

                    complete();

                }

                function complete() {

                    $(".lightbox-loading").css({
                        "display": "none"
                    });

                    $lightboxContainer.css({
                        "visibility": ""
                    });

                    Adapt.trigger("close");

                    Adapt.trigger('popup:closed');
                    $('body').scrollEnable();
                }

            },

            updateProgressBars: function() {
                var linkId = this.model.get("_linkId");
                if (!linkId) return;


                var blockModel = Adapt.findById(linkId);
                var componentModels = blockModel.findDescendants("components");
                componentModels = new Backbone.Collection(componentModels.where({
                    "_isAvailable": true
                }));

                var completeComponents = new Backbone.Collection(componentModels.where({
                    _isInteractionComplete: true
                }));

                var percentageComplete = 100;
                if (componentModels.length > 0) {
                    percentageComplete = (completeComponents.length / componentModels.length ) * 100;
                }

                this._editorialArticleView.$("."+linkId+" .lightbox-link-progress-bar").css({
                    "width": percentageComplete +"%"
                });
            },

            onResize: Backbone.callParents("onResize", function() {
                if (!this._lightboxOpen) return;
                if (!$(window).haveDimensionsChanged(this._windowDimensions)) return;
                this.resizeLightbox();
            }),

            onRemove: Backbone.callParents("onRemove", function() {
                var linkId = this.model.get("_linkId");
                if (!linkId) return;

                if (this._resizeLightbox) $(window).off("resize", this._resizeLightbox);
                delete this._resizeLightbox;

                var $lightboxContainer = this._editorialArticleView.$lightbox;
                $lightboxContainer.find(".close-button").off("click", this._onCloseClick);
                delete this._onCloseClick;

                this.$("button[data-link]").off("click", this._onLinkClick);
                this.$(".text").off("click", this._onLinkClick);
                delete this._onLinkClick;
            })

        }),

        Model: Tile.Model.extend({

            defaults: Backbone.callParents("defaults", function() {
                return {
                    "_linkId": null,
                    "_linkText": "Link text",
                    "_linkInstruction": "This is the link instruction",
                    "_linkStyle": "title",
                    
                };
            })

        })

    });

    return LightboxTile;

});

