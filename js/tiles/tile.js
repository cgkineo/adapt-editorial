define([
    'coreJS/adapt',
    '../lib/Backbone.Inherit',
    '../lib/raf'
], function(Adapt) {

    //function for dividing up json settings and trimming white text
    var attributeSplitRegEx = /([\,]{1})|([^,]*\'.*\'[^,]*)|([^,]*\".*\"[^,]*)|([^,]*\(.*\)[^,]*)|([^,]*)/g;
    var trimRegEx = /^\s+|\s+$/g;
    function splitAttribute(attr) {
        var matches = attr.match(attributeSplitRegEx);
        var ret = [];
        var currentValue = "";
        for (var i = 0, l = matches.length; i < l; i++) {
            var match = matches[i];
            switch (match) {
            case ",":case "":
                ret.push(currentValue);
                currentValue = "";
                break;
            default:
                currentValue = match.replace(trimRegEx, '');
            }
        }
        return ret;
    }


    //tile unit
    var Tile = {

        //base tile view
        View: Backbone.View.extend({

            _isIE8: false,
            _isRemoved: false,
            _editorialArticleView: null,
            _hasReCheckedSize: true,

            classes: function() {
                return [
                    "tile",
                    "clearfix", 
                    this.model.get('_type'),
                    this.model.get('_id'),
                    this.model.get('_classes')
                ];
            },

            initialize: function(options) {
                this.$el.attr("class", _.uniq(this.classes()).join(" "));
                this.$el.attr("name", this.model.get("_id"));
                
                this._editorialArticleView = options.editorialArticleView;
                if (this.model.get("_editorialModel").get("_forceIE8")) this._isIE8 = true;
                this._parentView = options.parentView;

                this.setupEventListeners();

                this.setupHasText();
                
                this.onInitialize();
                
                this.preRender();
                this.render();

            },

            setupEventListeners: function() {

                this.listenTo(this._editorialArticleView, "resize", this.preResize);
                this.listenTo(this._parentView, "resize", this.preResize);
                this.listenToOnce(this._editorialArticleView, 'remove', this.onRemove);

            },

            setupHasText: function() {
                var hasText = false;
                var model = this.model.toJSON();
                for (var k in model) {
                    if (k == "defaults") continue;
                    switch (k.slice(0,1)) {
                    case "_": case "@": case "#":
                        break;
                    default:
                        if (model[k]) hasText = true;
                        break;
                    }
                }

                this.model.set("_hasText", hasText);
            },

            onInitialize: function() {},

            preRender: function() {},

            render: function() {

                var data = this.model.toJSON();
                _.extend(data, { _globals: Adapt.course.get("_globals") });
                var template = Handlebars.templates[this.constructor.template];
                this.$el.html(template(data));

                _.defer(_.bind(function() {
                    // don't call postRender after remove
                    if(this._isRemoved) return;

                    this.postRender();

                }, this));

                return this;
            },

            postRender: function() {
                Adapt.trigger("tileView:postRender", this);
                this.checkReadyStatus();
            },

            checkReadyStatus: function() {
                this.setReadyStatus();
            },

            setReadyStatus: function() {
                this._editorialArticleView.trigger("tileView:ready");
            },

            preResize: function() {
                this.setupGridVariables();
                _.defer(_.bind(this.onResize, this));
            },

            onResize: function() {

                this.styleClear();

                var styleObject = this.getCalculatedStyleObject();
                this.renderStyle(styleObject);

            },

            setupGridVariables: function() {

                this.setupGridFixedVariables();
                this.setupGridRelativeVariables();

            },

            setupGridFixedVariables: function() {
                var config = this.model.toJSON();

                var rootKeys = _.filter(_.keys(config), function(key) {
                    if (key.slice(0,1) == "#") return true;
                });

                for (var vk = 0, vkl = rootKeys.length; vk < vkl; vk++) {
                    var key = rootKeys[vk];
                    var oKey = key;

                    if (key.slice(0,4) == "#ie8") continue;
                    if (this._isIE8) {
                        var ie8Key = "#ie8" + key.slice(1,2).toUpperCase() + key.slice(2);
                        if (config[ie8Key]) {
                            key = ie8Key;
                        }
                    }

                    var values = splitAttribute(config[key]);
                    var defaultValue;
                    if (config.defaults[oKey]) {
                        var defaultValues = splitAttribute(config.defaults[oKey]);
                        defaultValue = defaultValues[ config._editorialModel.get("_spanColumns") -1 ];
                    }

                    var value = values[ config._editorialModel.get("_spanColumns") -1 ];

                    if (value === undefined || value == "") {
                        value = defaultValue;
                    }
                    
                    this.$el.attr(oKey.slice(1), value);
                    var childContainer = this.$(".tile-container");
                    if (childContainer.length > 0) {
                        childContainer.attr(oKey.slice(1), value);
                    }
                    switch(value) {
                    case "no": case "false":
                        value = false;
                        break;
                    case "yes": case "true":
                        value = true;
                        break
                    }
                    this.model.set("_"+oKey.slice(1), value);
                }
            },

            setupGridRelativeVariables: function() {
                var config = this.model.toJSON();

                var relativeKeys = _.filter(_.keys(config), function(key) {
                    if (key.slice(0,1) == "@") return true;
                });

                for (var vk = 0, vkl = relativeKeys.length; vk < vkl; vk++) {
                    var key = relativeKeys[vk];
                    var oKey = key;
                    
                    if (key.slice(0,4) == "@ie8") continue;
                    if (this._isIE8) {
                        var ie8Key = "@ie8" + key.slice(1,2).toUpperCase() + key.slice(2);
                        if (config[ie8Key]) {
                            key = ie8Key;
                        }
                    }

                    var values = splitAttribute(config[key]);
                    var defaultValue;
                    if (config.defaults[oKey]) {
                        var defaultValues = splitAttribute(config.defaults[oKey]);
                        defaultValue = defaultValues[ config._editorialModel.get("_spanColumns") -1 ];
                    }

                    var value = values[ config._parentModel.get("_spanColumns") - 1 ];
                    
                    if (value === undefined || value == "") {
                        value = defaultValue;
                    }

                    this.$el.attr(oKey.slice(1), value);
                    var childContainer = this.$(".tile-container");
                    if (childContainer.length > 0) {
                        childContainer.attr(oKey.slice(1), value);
                    }
                    switch(value) {
                    case "no": case "false":
                        value = false;
                        break;
                    case "yes": case "true":
                        value = true;
                        break
                    }
                    this.model.set("_"+oKey.slice(1), value);
                    
                }
            },

            styleClear: function() {
                this.renderStyle({});
            },

            getCalculatedStyleObject: function() {
                var styleObject = this.model.toJSON();

                //tile height/width ratio
                this.$el.css("min-height", "");
                if (styleObject['_ratio']) {
                
                    styleObject._tileHeight = this.$el.width() * styleObject['_ratio'];
                    
                } else if (styleObject['_fillHeight']) {
                    _.defer(_.bind(function() {
                        var $parent = this.$el.parent();
                        var parentHeight = $parent.height();
                        if (this.$el.height() < parentHeight) {
                            this.$el.css("min-height", parentHeight);
                            this.trigger("resize");
                        }
                    }, this));

                }

                return styleObject;
                
            },

            renderStyle: function(styleObject) {

                var tileHeight = styleObject._tileHeight ? styleObject._tileHeight+"px" : "";
                var tileVerticalAlign = styleObject._verticalAlign || ""
                var tileBackground = styleObject._background || ""
                this.$el.css({ 
                    "height": tileHeight,
                    "vertical-align": tileVerticalAlign,
                    "background": tileBackground
                });
                
            },

            onRemove: function() {
                 this.resetViewState();
                 this.remove();
            },

            resetViewState: function() {
                this._isRemoved = true;
                this._editorialArticleView = null;
            }

        }),

        //base tile model
        Model: Backbone.Model.extend({

            defaults: function() {
                return {
                    "@spanColumns": "1,2,3,4",
                    "#ratio": ",,,",
                    "#fillHeight": "false,false,false,false"
                };
            },

            initialize: function() {

                var config = this.toJSON();
                this.set("defaults", this.defaults());

                var fixedKeys = _.filter(_.keys(config), function(key) {
                    if (key.slice(0,1) == "_") return true;
                });

                for (var vk = 0, vkl = fixedKeys.length; vk < vkl; vk++) {
                    var key = fixedKeys[vk];

                    if (key.slice(0,4) == "_ie8") continue;
                    if (this._isIE8) {
                        var ie8Key = "_ie8" + key.slice(1,2).toUpperCase() + key.slice(2);
                        if (config[ie8Key]) {
                            this.set(key, config[ie8Key]);
                        }
                    }

                    
                }

            }

        }),


        //tile registry

        _tileStore: {},
    
        register: function(name, object) {
            if (Tile._tileStore[name])
                throw Error('This component already exists in your project');
            if (!object.View) object.View =  Tile.View.extend({});
            if (!object.Model) object.Model =  Tile.Model.extend({});
            object.View.template = "e-"+name;
            Tile._tileStore[name] = object;
        },
    
        get: function(name) {
            return Tile._tileStore[name];
        },

        //unit extention function

        extend: function(to) {
            return _.extend({}, Tile, to);
        }

    };

    return Tile;

});
