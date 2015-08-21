define([
    'coreJS/adapt',
    './media',
    '../lib/mediaelement-and-player.min'
], function(Adapt, MediaTile) {

    var VideoTile = {
        
        View: MediaTile.View.extend({

            events: {
                "click .media-inline-transcript-button": "onToggleInlineTranscript",
                "mouseover": "onMouseOver",
                "mouseout": "onMouseOut"
            },

            _mouseOn: false,
            _blockFade: false,
            _isTouch: false,
            _isPlaying: false,
            _forceResize: true,

            onInitialize: Backbone.callParents("onInitialize", function() {
                this.onPause();
                this._isTouch = Modernizr.touch;
                this._onFadeInOut = _.debounce(_.bind(this.onFadeInOut, this), 100);
                this._unblockFade = _.bind(this.unblockFade, this);
                this._onWindowResize = _.bind(this.onWindowResize, this);
                $(window).on("resize", this._onWindowResize);
                this.listenTo(Adapt, 'accessibility:toggle', this.onAccessibilityToggle);
            }),

            onMouseOver: function(event) {
                if (this._isTouch) return;
                if (this._mouseOn) return;
                this._onFadeInOut();
                this._mouseOn = true;
            },

            onMouseOut: function(event) {
                if (this._isTouch) return;
                if (!this._mouseOn) return;
                this._onFadeInOut();
                this._mouseOn = false;
            },

            onFadeInOut: function() {
                if (!this.model.get("_textOverlay")) return;
                if (this._blockFade) return;
                if (this._mouseOn) {
                    this.$(".text").velocity("stop").velocity({opacity:.5}, {duration:250});
                } else {
                    this.$(".text").velocity("stop").velocity({opacity:1}, {duration:250});
                }
            },

            unblockFade: function() {
                this._blockFade = false;
                this._onFadeInOut();            
            },

            onPlay: function() {
                this.$el.attr("playing", true);
                this._isPlaying = true;

                this.toggleText();
            },

            onPause: function() {
                this.$el.attr("playing", false);
                this._isPlaying = false;

                this.toggleText();
            },

            toggleText: function() {
                if (!this.model.get("_textOverlay")) {
                    this.resetText();
                    return;
                };
                this._blockFade = true;
                if (this._isPlaying) {
                    switch (this.model.get("_textPosition")) {
                    case "left":
                        this.$(".text.top").velocity("stop").velocity({ opacity: this._mouseOn ? .5 : 1, left: -this.$(".text.top").width()+"px"}, { complete: this._unblockFade});
                        break;
                    case "top":
                        this.$(".text.top").velocity("stop").velocity({ opacity: this._mouseOn ? .5 : 1, top: -this.$(".text.top").height()+"px"}, { complete: this._unblockFade});
                        break;
                    case "right":
                        this.$(".text.bottom").velocity("stop").velocity({ opacity: this._mouseOn ? .5 : 1, right: -this.$(".text.top").width()+"px"}, { complete: this._unblockFade});
                        break;
                    case "bottom":
                        this.$(".text.bottom").velocity("stop").velocity({ opacity: this._mouseOn ? .5 : 1, bottom: -this.$(".text.top").height()+"px"}, { complete: this._unblockFade});
                    }
                } else {
                    switch (this.model.get("_textPosition")) {
                    case "left":
                        this.$(".text.top").velocity("stop").velocity({ opacity: this._mouseOn ? .5 : 1, left: 0+"px"}, { complete: this._unblockFade })
                        break;
                    case "top":
                        this.$(".text.top").velocity("stop").velocity({ opacity: this._mouseOn ? .5 : 1, top: 0+"px"}, { complete: this._unblockFade })
                        break;
                    case "right":
                        this.$(".text.bottom").velocity("stop").velocity({ opacity: this._mouseOn ? .5 : 1, right: 0+"px"}, { complete: this._unblockFade })
                        break;
                    case "bottom":
                        this.$(".text.bottom").velocity("stop").velocity({ opacity: this._mouseOn ? .5 : 1, bottom: 0+"px"}, { complete: this._unblockFade })
                        break;
                    }
                }
            },

            resetText: function() {
                this.$(".text").css({
                    top: "",
                    left: "",
                    right: "",
                    bottom: "",
                });
            },

            postRender: Backbone.callParents("postRender", function() {
                this.setupPlayer();
            }),

            setupPlayer: function() {
                if(!this.model.get('_playerOptions')) this.model.set('_playerOptions', {});

                var modelOptions = this.model.get('_playerOptions');

                if(modelOptions.pluginPath === undefined) modelOptions.pluginPath = 'assets/';
                if(modelOptions.features === undefined) modelOptions.features = ['playpause','progress','current','duration'];
                if(modelOptions.clickToPlayPause === undefined) modelOptions.clickToPlayPause = true;
                modelOptions.success = _.bind(this.onPlayerReady, this);

                var hasAccessibility = Adapt.config.has('_accessibility') && Adapt.config.get('_accessibility')._isActive
                    ? true
                    : false;
                    
                if (hasAccessibility) modelOptions.alwaysShowControls = true;

                // create the player
                this.$('audio, video').mediaelementplayer(modelOptions);

                // We're streaming - set ready now, as success won't be called above
                if (this.model.get('_media').source) {
                    this.$('.media-widget').addClass('external-source');
                    this.setReadyStatus();
                }
            },

            // Overrides the default play/pause functionality to stop accidental playing on touch devices
            setupPlayPauseToggle: function() {
                // bit sneaky, but we don't have a this.mediaElement.player ref on iOS devices
                var player = this.mediaElement.player;

                if(!player) {
                    console.log("Media.setupPlayPauseToggle: OOPS! there's no player reference.");
                    return;
                }

                // stop the player dealing with this, we'll do it ourselves
                player.options.clickToPlayPause = false;

                // play on 'big button' click
                $('.mejs-overlay-button',this.$el).click(_.bind(function(event) {
                    player.play();
                }, this));

                // pause on player click
                $('.mejs-mediaelement',this.$el).click(_.bind(function(event) {
                    var isPaused = player.media.paused;
                    if(!isPaused) player.pause();
                }, this));
            },

            onRemove: Backbone.callParents("onRemove", function() {
                if ($("html").is(".ie8")) {
                    var obj = this.$("object")[0];
                    if(obj) {
                        obj.style.display = "none";
                    }
                }
                if(this.mediaElement) {
                    $(this.mediaElement.pluginElement).remove();
                    delete this.mediaElement;
                }
                if (this._onWindowResize) {
                     $(window).on("resize", this._onWindowResize);
                     delete this._onWindowResize;
                }
            }),

            onPlayerReady: function (mediaElement, domObject) {
                this.mediaElement = mediaElement;

                if (!this.mediaElement.player) {
                    this.mediaElement.player =  mejs.players[$('.mejs-container').attr('id')];
                }

                $(this.mediaElement).on("play", _.bind(this.onPlay, this));
                $(this.mediaElement).on("pause", _.bind(this.onPause, this))

                this.showControls();

                var hasTouch = mejs.MediaFeatures.hasTouch;
                if(hasTouch) {
                    this.setupPlayPauseToggle();
                }

                this.setReadyStatus();
            },

            onAccessibilityToggle: function() {
               this.showControls();
            },

            onToggleInlineTranscript: function(event) {
                if (event) event.preventDefault();
                var $transcriptBodyContainer = $(".media-inline-transcript-body-container");
                var $button = $(".media-inline-transcript-button");

                if  ($transcriptBodyContainer.hasClass("inline-transcript-open")) {
                    $transcriptBodyContainer.slideUp();
                    $transcriptBodyContainer.removeClass("inline-transcript-open");
                    $button.html(this.model.get("_transcript").inlineTranscriptButton);
                } else {
                    $transcriptBodyContainer.slideDown().a11y_focus();
                    $transcriptBodyContainer.addClass("inline-transcript-open");
                    $button.html(this.model.get("_transcript").inlineTranscriptCloseButton);
                }
            },

            showControls: function() {
                var hasAccessibility = Adapt.config.has('_accessibility') && Adapt.config.get('_accessibility')._isActive
                    ? true
                    : false;
                    
                if (hasAccessibility) {
                    if (!this.mediaElement.player) return;

                    var player = this.mediaElement.player;

                    player.options.alwaysShowControls = true;
                    player.enableControls();
                    player.showControls();

                    this.$('.mejs-playpause-button button').attr({
                        "role": "button"
                    });
                    var screenReaderVideoTagFix = $("<div role='region' aria-label='.'>");
                    this.$('.mejs-playpause-button').prepend(screenReaderVideoTagFix);

                    this.$('.mejs-time, .mejs-time-rail').attr({
                        "aria-hidden": "true"
                    });
                }
            },

            onResize: Backbone.callParents("onResize", function() {
                
                this.toggleText();

                this._forceResize = true;
                $(window).resize();
            }),

            getCalculatedStyleObject: Backbone.callParents("getCalculatedStyleObject", function() {
                var styleObject = this.model.toJSON();

                switch (styleObject._textPosition) {
                case "top": case "bottom":
                    styleObject._mediaRestrict = "100% auto";
                    styleObject._mediaPosition = "center top";
                }

                return styleObject;
            }),

            onWindowResize: function() {
                if (!$(window).haveDimensionsChanged() && !this._forceResize) return;
                this._forceResize = false;

                if (this.model.get('_media').source) {
                    this.$('.mejs-container').width(this.$('.component-widget').width());
                } else {
                    this.$('audio, video').width(this.$('.component-widget').width());
                    this.$('.mejs-container').width(this.$('.component-widget').width());
                }

                var styleObject = this.getCalculatedStyleObject();
                this.renderStyle(styleObject);
            }

        }),

        Model: MediaTile.Model.extend({
            defaults: Backbone.callParents("defaults", function() {
                return {
                    "#mediaRestrict": "100% 100%,100% 100%,100% 100%,100% 100%",
                    "#mediaSize": "100% auto,100% auto,100% auto,100% auto",
                    "#mediaDynamicRatio": "true,true,true,true"
                };
            })
        })
    };

    MediaTile.register('video', VideoTile);

    return VideoTile;

});
