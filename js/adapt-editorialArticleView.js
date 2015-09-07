define([
    'coreJS/adapt',
    'coreViews/articleView',
    './tiles/tile',
], function(Adapt, ArticleView, Tile) {

    var EditorialView = {

        _tilesReady: 0,
        _primaryTilePixelWidth: 0,
        _editorialModel: null,
        
        render: function() {
            ArticleView.prototype.render.call(this);
            if (this.model.isEditorialEnabled && this.model.isEditorialEnabled()) {
                this._editorialModel = this.model.get("_editorialModel");
                if (this._editorialModel.get("_forceIE8")) this.$el.addClass("ie8");
                this.$el.addClass(this._editorialModel.get("_classes"));
                this.$(".block-container").removeClass("block-container");
                this.$el.append( $(Handlebars.templates['adapt-editorialArticleView'](this.model.toJSON())) );

            }
        },

        postRender: function() {
            ArticleView.prototype.postRender.call(this);
            if (this.model.isEditorialEnabled()) {
                this.setupEditorialEventListeners();
                this.addEditorialChildren();
            }
        },

        setupEditorialEventListeners: function() {
            this.listenToOnce(Adapt, "remove", this.onRemoveEditorial);
            this.listenTo(Adapt, "device:resize", this.onResizeEditorial);
            this.listenTo(Adapt, "device:change", this.onResizeEditorial);
            this.on("tileView:ready", this.onEditorialTileReady);
        },

        addChildren: function() {
            var $articleBlockContainer = this.$lightbox.find(".article-block-container");
            var $blockContainer = $articleBlockContainer.find("[name='"+ this.model.get("_id")+"']");
            if ($blockContainer.length === 0) $blockContainer = $('<div name="' + this.model.get("_id") + '"></div>' );
            $articleBlockContainer.append( $blockContainer )
            var nthChild = 0;
            var children = this.model.getChildren();
            var models = children.models;
            for (var i = 0, len = models.length; i < len; i++) {
                var model = models[i];
                if (model.get('_isAvailable')) {

                    var components = model.getChildren();
                    _.each(components.models, function(component) {
                        if (component.get("_isQuestionType") && component.get("_feedback")) {
                            component.get("_feedback")._type = "overlay";
                        }
                    });

                    nthChild ++;
                    var ChildView = this.constructor.childView || Adapt.componentStore[model.get("_component")];
                    //var $parentContainer = this.$(this.constructor.childContainer);
                    var $parentContainer = $blockContainer;
                    model.set("_nthChild", nthChild);
                    $parentContainer.append(new ChildView({model:model}).$el);
                }
            }
        },

        addEditorialChildren: function() {
            var editorialModel = this.model.get("_editorialModel");

            var $tilesById = {};
            var $tileContainersById = {};
            var groupViews = {};

            //create group tiles in cascade order
            //this is so that the resize event triggers the resize of groups in cascade order

            var groupModels = editorialModel.get("_groupModels");
            var GroupInstantiator = Tile.get("group");
            for (var groupModel, i = 0; groupModel = groupModels.models[i++];) {
                var groupId = groupModel.get("_id");
                var groupParentId = groupModel.get("_parentId");
                var groupView = new GroupInstantiator.View({ model: groupModel, editorialArticleView: this });

                groupViews[groupId] = groupView;
                $tilesById[groupId] =  groupView.$el;
                $tileContainersById[groupId] = groupView.$(".tile-container");

            }

            //create non-group tiles
            var contentModels = editorialModel.get("_contentModels");
            for (var tileModel, i = 0; tileModel = contentModels.models[i++];) {
                var tileId = tileModel.get("_id");
                var tileType = tileModel.get("_type");
                var TileInstantiator = Tile.get(tileType);
                var tileParentId = tileModel.get("_parentId");
                var tileView;
                if (tileParentId) {
                    tileView = new TileInstantiator.View({ model: tileModel, editorialArticleView: this, parentView:  groupViews[tileParentId]});
                } else {
                    tileView = new TileInstantiator.View({ model: tileModel, editorialArticleView: this, parentView: undefined });
                }

                $tilesById[tileId] =  tileView.$el;
            }

            //add new elements to dom in tile order
            var $primaryTile = this.$('.tile-container.primary');
            var tileModels = editorialModel.get("_tileModels");
            for (var tileModel, i = 0; tileModel = tileModels.models[i++];) {
                var tileId = tileModel.get("_id");
                var tileParentId = tileModel.get("_parentId");
                var $element = $tilesById[tileId];

                if (tileParentId) {
                    $tileContainersById[tileParentId].append( $element  );
                } else {
                    $primaryTile.append( $element );
                }
            }

        },

        onEditorialTileReady: function() {
            var tilesModels = this._editorialModel.get("_tileModels");

            this._tilesReady++;

            var hasFinishedLoading = this._tilesReady >= tilesModels.models.length;

            if (hasFinishedLoading) this.onEditorialArticleReady();
        },

        onEditorialArticleReady: function() {
            this.off("tileView:ready", this.onEditorialTileReady);
            this.model.set("_isEditorialReady", true);
            this.model.checkReadyStatus();
            this.onResizeEditorial();
        },

        onResizeEditorial: function() {
            if (!this.model.get("_isEditorialReady")) return;
            
            window.requestAnimationFrame(_.bind(function() {

                if (!this.setupEditorialPrimaryTileColumnWidth()) return;


                var style = this.$("style").remove(); //ios fix - remove and readd the styling
                this.$el.append(style); //ios fix

                this.trigger("resize");

                _.defer(_.bind(function() {
                    this.$(".editorial-container").css({
                        "visibility": ""
                    }); //ie8 hide until finished fix
                }, this));

            }, this));
        },

        setupEditorialPrimaryTileColumnWidth: function() {

            var screenSize = Adapt.course.get("screenSize");
            var maxColumns = this._editorialModel.get("_maxColumns");

            var columnMaxPixelWidth = Math.floor(screenSize.large / maxColumns);

            var $primaryTile = this.$('.tile-container.primary');
            var primaryTilePixelWidth = $primaryTile.outerWidth();

            if (this._primaryTilePixelWidth == primaryTilePixelWidth) return false;
            this._primaryTilePixelWidth = primaryTilePixelWidth;

            //calculate primary tile grid column size
            var primaryTileColumnWidth = Math.floor(primaryTilePixelWidth / columnMaxPixelWidth) || 1;
            
            $primaryTile.attr("spanColumns", primaryTileColumnWidth);
            this._editorialModel.set("_spanColumns", primaryTileColumnWidth);

            return true;
        },


        onRemoveEditorial: function() {
            this.removeEditorialEventListeners();
            this.model.set("_isEditorialReady", false);
            this.trigger("remove");
        },

        removeEditorialEventListeners: function() {
            this.stopListening(Adapt, "device:resize", this.onResizeEditorial);
            this.off("tileView:ready", this.onEditorialTileReady);
        }

    };

    return EditorialView;

});