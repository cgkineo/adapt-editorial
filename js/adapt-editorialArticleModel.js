define([
    'coreModels/articleModel',
    './tiles/tile'
], function(ArticleModel, Tile) {

    var EditorialModel = {

        postInitialize: function() {
            if (!this.isEditorialEnabled()) return;
            this.set("_isEditorialReady", false);
            this.setupEditorial();
            this.setupEditorialGridRules();
            this.setupEditorialChildren();
        },

        isEditorialEnabled: function() {
            var config = this.getEditorialConfig();
            return config && config._isEnabled;
        },

        setupEditorial: function() {
            var config = this.getEditorialConfig();
            _.extend(config, { _id: this.get("_id") });
            this.set("_editorialModel", new Backbone.Model(config));

        },

        setupEditorialGridRules: function() {
            var editorialModel = this.get("_editorialModel");
            var maxColumns = editorialModel.get("_maxColumns");

            var rules = [];
            for (var i = 0, l = maxColumns; i < l; i++) {
                for (var r = 0, rl = i + 2; r < rl; r++) {
                    var columnWidth = i + 1;
                    rules.push({
                        "_columnWidth": columnWidth,
                        "_spanColumns": r,
                        "_displayNone": r == 0 ? true : false,
                        "_width": Math.floor((r / columnWidth) * 10000) / 100
                    });
                }
            }

            editorialModel.set("_columnStyleRules", rules);
        },

        setupEditorialChildren: function() {
            var articleId = this.get("_id");
            var editorialModel = this.get("_editorialModel");

            var tiles = editorialModel.get("_tiles");

            var indexedTiles = _.indexBy(tiles, "_id");

            var groups = this.getEditorialGroupCascadeOrder();
            var groupModelsIndexed = {};
            var tileModelsIndexed = {};

            var GroupInstantiator = Tile.get("group");
            for (var group, i = 0; group = groups[i++];) {

                group._editorialId = articleId;
                group._editorialModel = editorialModel;

                if (group._parentId) {
                    group._parentModel = groupModelsIndexed[group._parentId];
                } else {
                    group._parentModel = editorialModel;
                }

                var groupModel = new GroupInstantiator.Model(group);
                groupModelsIndexed[group._id] = groupModel;
            }

            editorialModel.set("_groupModels", new Backbone.Collection(_.values(groupModelsIndexed)));
            
            var contentTiles = _.filter(tiles, function(tile) { return tile._type != "group" });
            var contentTilesIndexed = {};
            for (var tile, i = 0; tile = contentTiles[i++];) {
                tile._editorialId = articleId;
                tile._editorialModel = editorialModel;

                var TileInstantiator = Tile.get(tile._type);

                if (tile._parentId) {
                    tile._parentModel = groupModelsIndexed[tile._parentId];
                } else {
                    tile._parentModel = editorialModel;
                }

                var tileModel = new TileInstantiator.Model(tile);

                contentTilesIndexed[tile._id] = tileModel;
            }

            for (var tile, i = 0; tile = tiles[i++];) {
                tileModelsIndexed[tile._id] = groupModelsIndexed[tile._id] || contentTilesIndexed[tile._id];
            }


            editorialModel.set("_contentModels", new Backbone.Collection(_.values(contentTilesIndexed)));
            editorialModel.set("_tileModels", new Backbone.Collection(_.values(tileModelsIndexed)));
        },

        getEditorialConfig: function() {
            return this.get("_editorial");
        },

        checkReadyStatus: function(model, val) {
            if (!this.isEditorialEnabled()) ArticleModel.prototype.checkReadyStatus.call(this);
            if (!this.get("_isEditorialReady")) return;

            var availableChildren = new Backbone.Collection(this.findDescendants('components').where({_isAvailable: true, _isOptional:false}));
            var notReadyChildren = availableChildren.where({_isReady: false});
            var hasNotReadyChildren = notReadyChildren.length > 0;

            var notReadyIds = [];
            _.each(notReadyChildren, function(item){
                notReadyIds.push(item.get("_id"));
            });
            console.log(notReadyIds.join(","))

            if (hasNotReadyChildren) return;

            this.set("_isReady", true);
        },

        getEditorialGroupCascadeOrder: function() {
            //sort groups by descendent levels

            var groupCascadeOrder = [];

            var editorialModel = this.get("_editorialModel");
            var tiles = editorialModel.get("_tiles");

            var groups = _.where(tiles, { _type: "group" });
            var groupIndex = _.indexBy(groups, "_id");
            var rootGroups = _.filter(groups, function(group) {
                return !group._parentId;
            });

            var resolve = rootGroups;
            removeResolveFromGroups();

            var tick = 0;
            //stop if no more in groups array and not move in resolve array or stack overrun.
            while ((groups.length > 0 || resolve.length > 0) && tick < 100) {

                //add all resolve elements to cascade order
                for (var r = 0, rl = resolve.length; r < rl; r++) {
                    var resItem = resolve[r];
                    groupCascadeOrder.push(resItem);
                }

                //get resolve elements children and put in resolve
                resolveNextChildren();

                //remove resolve elements from groups array
                removeResolveFromGroups();

                tick++;
            }

            return groupCascadeOrder;

            function removeResolveFromGroups() {
                groups = _.filter(groups, function(group) {
                    //if the resolve item found in groups list, remove it from groups list
                    return _.findWhere(resolve, {_id: group._id}) === undefined;
                });
            }

            function resolveNextChildren() {
                resolve = _.filter(groups, function(group) {
                    //if the group is child of a resolve item, add it to next resolve list
                    return _.findWhere(resolve, { _id: group._parentId}) !== undefined; 
                });
            }
        }
        
    };

    return EditorialModel;
});
