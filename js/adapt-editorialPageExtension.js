define([
    'coreJS/adapt',
    'coreViews/pageView',
    './adapt-editorialPageView'
], function(Adapt, PageView, ExtensionView) {

    /*  
        Here we are extending the pageView and pageModel in Adapt.
        This is to accomodate the new functionality on the page.
        The advantage of this method is that the extension behaviour can utilize all of the predefined page behaviour in both the view and the model.
    */  

    //Extends core/js/views/pageView.js
    var ViewInitialize = PageView.prototype.initialize;
    PageView.prototype.initialize = function(options) {
        var hasEditorialChildren = this.model.getChildren().filter(function(item) {
            return item.get("_editorial") !== undefined && item.get("_editorial")._isEnabled;
        });
        if (hasEditorialChildren.length > 0) {
            //extend the pageView with new functionality
            _.extend(this, ExtensionView);
        }
        //initialize the page in the normal manner
        return ViewInitialize.apply(this, arguments);
    };

});