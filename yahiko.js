(function( $, root, undefined ) {
    'use strict';

    var defaults = {
        loop:               false,
        useThumbs:          true,
        slideTimeout:       6000,
        animationTime:      100,
        preAnimationTime:   100,
        moveTime:           300,
        preContainerOffset: 128,
        el:                 'yahiko',
        item:               'yahiko__item',
        thumbs:             'yahiko__thumbs',
        thumb:              'yahiko__thumb',
        inner:              'yahiko__inner',
        tracker:            'yahiko__tracker',
        navNext:            'yahiko__next',
        navPrev:            'yahiko__prev',
        itemActive:         'yahiko__active',
        preContainer:       'yahiko__precontainer',
        stage:              'yahiko__stage'
    };

    function Yahiko( $el, options ) {
        this.init( $el, options );

        return {
            destroy: this.destroy,
            on: this.on,
            index: this.index
        };
    }

    Yahiko.prototype = {
        init: function( $el, options ) {
            this.index = 0;
            this.cacheObjects( $el, options );
            this.numerateItems();
            this.initThumbs();
            this.bindEvents();
            this.createTracker();
            this.getMaxHeight();
            this.displayNav();
            this.createPreSliders();
            this.createStages();
            this.setStage();
            this.setSize();
            this.setCurrIndex( 0 );
            this.triggerSelectItem( this.index );
            this.setInitalHeight();
        },

        cacheObjects: function( $el, options ) {
            this.stages       = { prev: 0, curr: 0, next: 0 };
            this.$activeThumb = $( {} );
            this.options      = $.extend( {}, defaults, options );
            this.isAnimated   = false;
            this.$activeSlide = null;
            this.$nullBox     = $( '<div>' );
            this.$thumbBox    = $( {} );
            this.$el          = $el;
            this.$els         = $el.find( '.' + this.options.item );
            this.$inner       = $el.find( '.' + this.options.inner );
            this.$navNext     = $el.find( '.' + this.options.navNext );
            this.$navPrev     = $el.find( '.' + this.options.navPrev );
        },

        disableSelection: function() {

        },

        triggerSelectItem: function( index ) {
            this.$el.trigger( 'yahiko:select', [ index, this.$els.eq( index ) ] );
        },

        bindEvents: function() {
            $( window ).on( 'resize', this.onResize.bind( this ) );
            this.disableSelection( this.$el[ 0 ] );

            if ( this.$els.length > 1 ) {
                this.$thumbBox.on( 'click', '.' + this.options.thumb + ':not(.active)', this.onThumbClick.bind( this ) );
                this.$el.on( 'mouseenter', this.onMouseEnter.bind( this ) );
                this.$el.on( 'mouseleave', this.onMouseLeave.bind( this ) );
                this.$navNext.click( this.onClickNext.bind( this ) );
                this.$navPrev.click( this.onClickPrev.bind( this ) );
                this.$navNext.mouseenter( this.onShowNextPrePanel.bind( this ) );
                this.$navNext.mouseleave( this.onHideNextPrePanel.bind( this ) );
                this.$navPrev.mouseenter( this.onShowPrevPrePanel.bind( this ) );
                this.$navPrev.mouseleave( this.onHidePrevPrePanel.bind( this ) );
            }
        },

        initThumbs: function() {
            if ( this.$els.length > 1 && this.options.useThumbs ) {
                this.createThumbs();
                this.setActiveThumb( 0 );
                this.startTimeout();
            }
        },

        createStages: function() {
            this.$prevStage = $( '<div>' ).addClass( this.options.stage + ' ' + this.options.stage + '_prev' ).appendTo( this.$tracker );
            this.$currStage = $( '<div>' ).addClass( this.options.stage + ' ' + this.options.stage + '_curr' ).appendTo( this.$tracker );
            this.$nextStage = $( '<div>' ).addClass( this.options.stage + ' ' + this.options.stage + '_next' ).appendTo( this.$tracker );
        },

        setStage: function() {
            this.stages = { prev: this.getPrevIndex(), curr: this.index, next: this.getNextIndex() };
            this.$prevStage.append( this.$els.eq( this.stages.prev ) );
            this.$nextStage.append( this.$els.eq( this.stages.next ) );
            this.$currStage.append( this.$els.eq( this.stages.curr ) );
        },

        getPrevIndex: function() {
            return this.index === 0 ? this.count : this.index - 1;
        },

        getNextIndex: function () {
            return this.index === this.count ? 0 : this.index + 1;
        },

        setCurrIndex: function( index ) {
            if ( index === this.count + 1 ) {
                this.index = 0;
            } else if ( index < 0 ) {
                this.index = this.count;
            } else {
                this.index = index
            }
        },

        numerateItems: function() {
            for ( var i = 0; i < this.$els.length; i++ ) {
                this.$els.eq( i ).addClass( this.options.item + '-' + i );
            }
        },

        createPreSliders: function() {
            this.$els.appendTo( this.$nullBox );
            this.$preSliders = this.$els.clone().hide();
            this.$preContainer = $( '<div>' ).addClass( this.options.preContainer ).append( this.$preSliders ).insertAfter( this.$tracker ).hide();
        },

        startTimeout: function() {
            this.timeoutCallback = setTimeout( function TimeoutCallback() {
                this.setCurrIndex( this.index + 1 );
                this.triggerSelectItem( this.index );
                this.move( this.index, 1 );
                this.setActiveThumb( this.index );
                this.startTimeout();
            }.bind( this ), this.options.slideTimeout );
        },

        createTracker: function() {
            var childs = this.$inner.children();
            this.count = this.$els.length - 1;
            this.$tracker = $( '<div>' ).append( childs ).appendTo( this.$inner );
            this.$tracker.addClass( this.options.tracker );
        },

        onResize: function() {
            this.setSize();
            this.setInitalHeight();
        },

        setSize: function() {
            this.trackerWidth = this.$el.width();
            this.$tracker.width( this.trackerWidth );
            this.$els.width( this.trackerWidth );
            this.$preSliders.width( this.trackerWidth );
            this.$inner.width( this.trackerWidth );
            this.$prevStage.css( { left: - this.trackerWidth } );
            this.$nextStage.css( { left: this.trackerWidth } );
        },

        onShowPrevPrePanel: function() {
            if ( this.index > 0 || this.options.loop ) {
                this.$preContainer.show().css( { left: - this.options.preContainerOffset, right: '' } ).stop().animate( { left: 0 }, this.options.preAnimationTime ).data( 'move', 'left' );
                this.$activeSlide && this.$activeSlide.hide();
                this.$activeSlide = this.$preSliders.eq( this.getPrevIndex() );
                this.$activeSlide.show().css( { left: - ( this.trackerWidth / 2 - 64 ) } );
            }
        },

        onHidePrevPrePanel: function() {
            if ( this.index > 0 || this.options.loop) {
                this.$preContainer.stop().animate( { left: - this.options.preContainerOffset }, this.options.preAnimationTime, function() {
                    this.$preContainer.hide();
                }.bind( this ) );
            }
        },

        onShowNextPrePanel: function() {
            if ( this.index < this.count || this.options.loop ) {
                this.$preContainer.show().css( { right: - this.options.preContainerOffset, left: '' } ).stop().animate( { right: 0 }, this.options.preAnimationTime ).data( 'move', 'right' );
                this.$activeSlide && this.$activeSlide.hide();
                this.$activeSlide = this.$preSliders.eq( this.getNextIndex() );
                this.$activeSlide.show().css( { left: - ( this.trackerWidth / 2 - 64 ) } );
            }
        },

        onHideNextPrePanel: function() {
            if ( this.index < this.count || this.options.loop ) {
                this.$preContainer.stop().animate( { right: - this.options.preContainerOffset }, this.options.preAnimationTime, function() {
                    this.$preContainer.hide();
                }.bind( this ) );
            }
        },

        onClickNext: function() {
            this.moveByNav( 1 );
            this.displayNavByIndex();
        },

        onClickPrev: function() {
            this.moveByNav( -1 );
            this.displayNavByIndex();
        },

        displayNav: function() {
            if ( this.options.loop && this.count > 2 ) {
                this.$navPrev.show();
                this.$navNext.show();
            } else {
                this.displayNavByIndex();
            }
        },

        displayNavByIndex: function() {
            if ( this.options.loop ) {
                return;
            }

            if ( this.index > 0 ) {
                this.$navPrev.show();
            } else {
                this.$navPrev.hide();
            }

            if ( this.index === this.count ) {
                this.$navNext.hide();
            } else {
                this.$navNext.show();
            }
        },

        onMoveEnd: function() {
            this.$tracker.find( '.' + this.options.item ).appendTo( this.$nullBox );
            this.$tracker.css( { left: 0 } );
            this.setStage();
            this.isAnimated = false;
        },

        moveByNav: function( direction ) {
            if ( this.isAnimated ) {
                return;
            }

            this.setCurrIndex( this.index + direction );
            this.triggerSelectItem( this.index );
            this.move( this.index, direction );
            this.setActiveThumb( this.index );
        },

        onMouseEnter: function() {
            clearTimeout( this.timeoutCallback );
        },

        onMouseLeave: function() {
            this.startTimeout();
        },

        onThumbClick: function( e ) {
            var newIndex = this.$thumbEls.index( $( e.target ) ),
                direction = this.index - newIndex > 0 ? - 1 : 1;

            this.setCurrIndex( newIndex );

            if ( direction > 0 && this.stages.next !== this.index ) {
                this.$nextStage.find( '.' + this.options.item ).appendTo( this.$nullBox );
                this.$nextStage.append( this.$els.eq( this.index ) );
            } else if ( direction < 0 && this.stages.prev !== this.index ) {
                this.$prevStage.find( '.' + this.options.item ).appendTo( this.$nullBox );
                this.$prevStage.append( this.$els.eq( this.index ) );
            }

            this.move( this.index, direction );
            this.setActiveThumb( this.index );
        },

        move: function( to, direction ) {
            this.isAnimated = true;
            var directionName = this.$preContainer.data( 'move' ), props = {};
            props[ directionName ] = - this.options.preContainerOffset;
            this.$tracker.stop().animate( { left: - direction * this.trackerWidth + 'px' }, this.options.moveTime, this.onMoveEnd.bind( this ) );
            this.$preContainer.animate( props, this.options.preAnimationTime );
        },

        setInitalHeight: function () {
            this.$inner.height( this.$els.eq( 0 ).height() );
        },

        setActiveThumb: function( index ) {
            if ( this.options.useThumbs ) {
                this.$activeThumb.removeClass( 'active' );
                this.$activeThumb = this.$thumbEls.eq( index ).addClass( 'active' );
            }
        },

        createThumbs: function() {
            var fragment = document.createDocumentFragment(), thumb;
            this.$thumbBox = $( '<div>' ).addClass( this.options.thumbs );
            for ( var i = 0, ilen = this.$els.length; i < ilen; i++ ) {
                thumb = $( '<div>' ).addClass( this.options.thumb );
                fragment.appendChild( thumb[ 0 ] );
            }
            this.$thumbBox[ 0 ].appendChild( fragment );
            this.$thumbEls = this.$thumbBox.find( '.' + this.options.thumb );
            this.$el.append( this.$thumbBox );
        },

        getMaxHeight: function() {
            this.maxheight = 0;
            this.$els.get().forEach( function( item ) {
                this.maxheight = Math.max( $( item ).height(), this.maxheight );
            }, this );
        },

        destroy: function() {

        },

        on: function() {

        },

        index: function() {

        }
    };

    $.fn.Yahiko = function( options ) {
        return $( this ).each( function() {
            var item = $( this );
            if ( item.data( 'Yahiko' ) ) {
                console.log( 'Yahiko already init', item );
            } else {
                item.data( 'Yahiko', new Yahiko( item, options || {} ) );
            }
        });
    };

})( jQuery, window );