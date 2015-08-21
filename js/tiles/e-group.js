define([
    './tile'
], function(Tile) {

    var GroupTile = {};

    Tile.register('group', GroupTile);

    return GroupTile;

});
