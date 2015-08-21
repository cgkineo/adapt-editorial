define([
    'coreJS/adapt',
    '../lib/draggabilly'
], function(Adapt, Draggabilly) {

    var elements = [
        {
            "_id": "",
            "_parentId": null,
            "_type": "group",
            "_classes": null,
            "#spanColumns": "4,4,4,4",
            "@ratio": ",,,,"
        },
        {
            "_id": "",
            "_parentId": null,
            "_classes": null,
            "_type": "text",
            "#spanColumns": "4,4,4,4",
            "@ratio": ",,,,"
        },
        {
            "_id": "",
            "_parentId": null,
            "_classes": null,
            "_type": "image",
            "#spanColumns": "4,4,4,4",
            "@ratio": ",,,,"
        },
        {
            "_id": "",
            "_parentId": null,
            "_classes": null,
            "_type": "video",
            "#spanColumns": "4,4,4,4",
            "@ratio": ",,,,"
        }
    ];

    var AuthoringMode = {

        View: Backbone.View.extend({
            _selectedEditorialId: null,
            _selectedEditorialModel: null,
            $selectedTile: null,
            _selectedTileOffset: null,
            _selectedTileScrollTop: null,

            initialize: function() {
                this.listenTo(Adapt, "device:resize", this.onResize);
                $(window).on("scroll", _.bind(this.onScroll, this));
                this.onResize();
                this.render();
            },
            onResize: function() {
                var screenSize = Adapt.course.get("screenSize");
                if ($(window).width() >=  screenSize.large + 400 ) {
                    $("html").removeClass('authoringmode-hide');
                } else {
                    $("html").addClass('authoringmode-hide');
                }
            },
            render: function() {

                var data = this.model.toJSON();
                _.extend(data, { _globals: Adapt.course.get("_globals") });
                var template = Handlebars.templates[this.template];
                this.$el.html(template(data));

                _.defer(_.bind(function() {
                    // don't call postRender after remove
                    if(this._isRemoved) return;

                    this.postRender();

                }, this));

                return this;
            },
            postRender: function() {
                this.setupEventListeners();
            },

            setupEventListeners: function() {
                $("body").on("click", ".tile-container.primary", _.bind(this.onSelectEditorial, this));
            },

            onSelectEditorial: function(event) {
                var $editorial = $(event.currentTarget);
                var editorialId = $editorial.attr("data-editorial");

                if (this._selectedEditorialId == editorialId) return;
                this._selectedEditorialId = editorialId;
                this._selectedEditorialModel = Adapt.findById(editorialId).get("_editorialModel");

                this.renderEditorialChildren();
                

            },

            renderEditorialChildren: function() {
                this.renderElements();
                this.renderToolbar();
                this.renderLayout();
            },

            renderToolbar: function() {
                var $rightPaneInner = this.$(".pane.pane-right .pane-inner .toolbar");
                $rightPaneInner.html("");
            },

            renderLayout: function() {
                var $rightPaneInner = this.$(".pane.pane-right .pane-inner .layout");
                $rightPaneInner.html("");

                var $tiles = {};

                var groupModels = this._selectedEditorialModel.get("_groupModels");
                groupModels.each(function(item, index) {
                    var id = item.get("_id");
                    var $tile = $(Handlebars.templates['e-authoringmode-tile'](item.toJSON()));
                    $tiles[id] = $tile;                    
                });

                var contentModels = this._selectedEditorialModel.get("_contentModels");
                contentModels.each(function(item, index) {
                    var id = item.get("_id");
                    var $tile = $(Handlebars.templates['e-authoringmode-tile'](item.toJSON()));
                    $tiles[id] = $tile;
                });

                var tileModels  = this._selectedEditorialModel.get("_tileModels");
                tileModels.each(_.bind(function(item, index) {
                    var id = item.get("_id");
                    var parentId = item.get("_parentId");
                    var $tile = $tiles[id];
                    var draggie = new Draggabilly( $tile[0], {
                        containment: "body"
                    });
                    draggie.on( 'pointerDown', _.bind(this.onTileMouseDown, this));
                    draggie.on( 'dragStart', _.bind(this.onTileStartDrag, this));
                    draggie.on( 'dragEnd', _.bind(this.onTileEndDrag, this));
                    draggie.on( 'pointerMove', _.bind(this.onTileMouseMove, this));
                    if (!parentId) {
                        $rightPaneInner.append($tile);    
                    } else {
                        $rightPaneInner.find("."+parentId+".authoring-tile-container").append($tile);
                    }
                }, this));
            },

            renderElements: function() {
                var $leftPaneInner = this.$(".pane.pane-left .pane-inner .elements");
                $leftPaneInner.html("");
                _.each(elements, function(item, index) {
                    var type = item._type
                    var $element = $(Handlebars.templates['e-authoringmode-element'](item));
                    $leftPaneInner.append($element);     
                });
            },

            onTileMouseDown: function(event, pointer) {
                event.stopPropagation();
            },

            onTileStartDrag: function(event, pointer) {
                var $target = $(event.target);
                if (!$target.is(".authoring-tile")) {
                    var $parents = $target.parents();
                    for (var i = 0, l = $parents.length; i < l; i++) {
                        var $parent = $($parents[i]);
                        if ($parent.is(".authoring-tile")) {
                            $target = $parent;
                            break;
                        }
                    }
                }
                $('html').addClass("authoring-selected");
                var offset = $target.offset()
                var scrollTop = $(window).scrollTop();
                var currentPos = {
                    top: (offset.top-scrollTop),
                    left: offset.left
                };
                var moveBy = {
                    top: (pointer.y - currentPos.top)+10,
                    left: (pointer.x - currentPos.left) + 10
                };
                $target.css({
                    "position": "fixed",
                    "top": currentPos.top + moveBy.top + "px",
                    "left": currentPos.left + moveBy.left + "px",
                    "z-index": 201
                });
                $("body").append($target);
                this._selectedTileOffset = offset;
                this._selectedTileScrollTop = scrollTop;
                this.$selectedTile = $target;
            },

            onTileEndDrag: function(event, pointer) {
                $('html').removeClass("authoring-selected");
                var $selectedTile = this.$selectedTile;
                var selectedId = $selectedTile.attr("data-editorial");
                this.$selectedTile = null;
                this._selectedTileOffset = null;
                this._selectedTileScrollTop = null;
                var $target = $(event.target);
                if (!$target.is(".authoring-dropzone")) {
                    $selectedTile.remove();
                    this.onTileRemoved(selectedId);
                    return;
                }
                $selectedTile.css({
                    "position": "",
                    "top": "",
                    "left": "",
                    "z-index": ""
                });
                var data = attrTextToJson($target.attr("data-editorial"));
                switch (data._placement) {
                case "prepend":
                    this.$el.find("."+data._id+".authoring-tile-container").prepend($selectedTile);
                    this.onTileMoved(selectedId, "prepend", data._id);
                    break;
                case "before":
                    $selectedTile.insertBefore(this.$el.find("."+data._id+".authoring-tile"));
                    this.onTileMoved(selectedId, "before", data._id);
                    break;
                case "after":
                    $selectedTile.insertAfter(this.$el.find("."+data._id+".authoring-tile"));
                    this.onTileMoved(selectedId, "after", data._id);
                    break;
                }                
            },

            onTileMouseMove: function(event) {
                this.$(".authoring-dropzone").removeClass("active");
                var $target = $(event.target);
                if (!$target.is(".authoring-dropzone")) return;
                $target.addClass("active");
            },

            onScroll: function(event) {
                if (!this.$selectedTile) return;

                var scrollTop = $(window).scrollTop();

            },

            onTileMoved: function() {

            },

            onTileRemoved: function() {

            },

            template: "e-authoringmode"
        }),

        Model: Backbone.Model.extend({
            
        })

    };

    return AuthoringMode;


    function attrTextToJson(text) {
        return JSON.parse(text.replace(/'{1}/g, '"'));
    }
});