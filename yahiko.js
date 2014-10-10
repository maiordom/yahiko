(function( $, root, undefined ) {
    'use strict';

    var defaults = {
        loop:             false,
        useDots:          false,
        slideTimeout:     6000,
        preAnimationTime: 150,
        moveTime:         300,
        el:               'yahiko',
        item:             'yahiko__item',
        dots:             'yahiko__dots',
        dot:              'yahiko__dot',
        inner:            'yahiko__inner',
        tracker:          'yahiko__tracker',
        navNext:          'yahiko__next',
        navPrev:          'yahiko__prev',
        itemActive:       'yahiko__active',
        preContainer:     'yahiko__precontainer',
        stage:            'yahiko__stage',
        transition:       'yahiko__transition',
        dotCurrent:       'yahiko__dot_current',
        transforms: {
            'webkitTransform': '-webkit-transform',
            'OTransform': '-o-transform',
            'msTransform': '-ms-transform',
            'MozTransform': '-moz-transform',
            'transform': 'transform'
        },
        transitionEnd: {
            WebkitTransition: 'webkitTransitionEnd',
            MozTransition: 'transitionend',
            OTransition: 'oTransitionEnd otransitionend',
            msTransition: 'MSTransitionEnd',
            transition: 'transitionend'
        }
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
            this.initDots();
            this.bindEvents();
            this.createTracker();
            this.displayNav();
            this.createPreSliders();
            this.createStages();
            this.setStage();
            this.setSize();
            this.setCurrIndex( 0 );
            this.triggerSelectItem( this.index );
            this.setInitialHeight();
        },

        getPrefixed: function( prop ) {
            var i, s = document.createElement( 'p' ).style,
                v = [ 'ms','O','Moz','Webkit' ];

            if( s[ prop ] == '' ) {
                return prop;
            }

            prop = prop.charAt( 0 ).toUpperCase() + prop.slice( 1 );

            for ( i = v.length; i--; ) {
                if ( s[ v[ i ] + prop ] == '' ) {
                    return ( v[ i ] + prop );
                }
            }
        },

        has3d: function() {
            var el = document.createElement( 'p' ),
                has3d,
                transforms = this.options.transforms;

            document.body.insertBefore( el, null );

            for ( var t in transforms ) {
                if ( el.style[ t ] !== undefined ) {
                    el.style[ t ] = 'translate3d( 1px, 1px, 1px )';
                    has3d = window.getComputedStyle( el ).getPropertyValue( transforms[ t ] );
                }
            }

            document.body.removeChild( el );

            return ( has3d !== undefined && has3d.length > 0 && has3d !== 'none' );
        },

        addEvent: function( el, e, fn, bool ) {
            if ( !e ) {
                return;
            }

            el.addEventListener ? el.addEventListener( e, fn, !!bool ) : el.attachEvent( 'on' + e, fn );
        },

        bindTransitionEnd: function( $el ) {
            var elData = $el.data();

            if ( elData.tEnd ) { return; }

            var el = $el[ 0 ],
                transitionEndEvent = this.options.transitionEnd;

            this.addEvent( el, transitionEndEvent[ this.getPrefixed( 'transition' ) ], function( e ) {
                elData.tProp && e.propertyName.match( elData.tProp ) && elData.onEndFn();
            });

            elData.tEnd = true;
        },

        afterTransition: function( $el, property, time, fn ) {
            var ok,
                elData = $el.data();

            if ( elData ) {
                elData.onEndFn = function() {
                    if ( ok ) { return; }
                    ok = true;
                    clearTimeout( elData.tT );
                    fn();
                };

                elData.tProp = property;
                clearTimeout( elData.tT );
                elData.tT = setTimeout( function() {
                    elData.onEndFn();
                }, time * 1.5);

                this.bindTransitionEnd( $el );
            }
        },

        cacheObjects: function( $el, options ) {
            this.stages       = { prev: 0, curr: 0, next: 0 };
            this.$activeDot  = $( {} );
            this.options      = $.extend( {}, defaults, options );
            this.isMoved      = false;
            this.$activeSlide = null;
            this.$nullBox     = $( '<div>' );
            this.$dotsBox     = $( {} );
            this.$el          = $el;
            this.$els         = $el.find( '.' + this.options.item );
            this.$inner       = $el.find( '.' + this.options.inner );
            this.$navNext     = $el.find( '.' + this.options.navNext );
            this.$navPrev     = $el.find( '.' + this.options.navPrev );
            this.transform    = this.getPrefixed( 'transform' );
            this.has3d        = this.has3d();
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
                this.$dotsBox.on( 'click', '.' + this.options.dot + ':not(.' + this.options.dotCurrent + ')', this.onDotClick.bind( this ) );
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

        initDots: function() {
            if ( this.$els.length > 1 && this.options.useDots ) {
                this.createDots();
                this.setActiveDot( 0 );
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
            this.$preContainer = $( '<div>' ).addClass( this.options.preContainer ).append( this.$preSliders ).insertAfter( this.$tracker );
            this.options.preContainerOffset = this.$preContainer.width();
            this.$preContainer.hide();
        },

        startTimeout: function() {
            this.timeoutCallback = setTimeout( function TimeoutCallback() {
                this.setCurrIndex( this.index + 1 );
                this.triggerSelectItem( this.index );
                this.move( this.index, 1 );
                this.setActiveDot( this.index );
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
            this.setInitialHeight();
        },

        setSize: function() {
            this.trackerWidth = this.$el.width();
            this.preContainerCenter = this.trackerWidth / 2 - this.options.preContainerOffset / 2;
            this.$tracker.width( this.trackerWidth );
            this.$els.width( this.trackerWidth );
            this.$preSliders.width( this.trackerWidth );
            this.$inner.width( this.trackerWidth );
            this.$prevStage.css( { left: - this.trackerWidth } );
            this.$nextStage.css( { left: this.trackerWidth } );
        },

        onShowPrevPrePanel: function() {
            if ( this.index > 0 || this.options.loop ) {
                this.$preContainer
                    .show()
                    .css( { left: - this.options.preContainerOffset, right: '' } )
                    .stop()
                    .animate( { left: 0 }, this.options.preAnimationTime )
                    .data( 'move', 'left' );

                this.$activeSlide && this.$activeSlide.hide();
                this.$activeSlide = this.$preSliders.eq( this.getPrevIndex() );
                this.$activeSlide.show().css( { left: - this.preContainerCenter } );
            }
        },

        onHidePrevPrePanel: function() {
            if ( this.index > 0 || this.options.loop) {
                this.$preContainer
                    .stop()
                    .animate( { left: - this.options.preContainerOffset }, this.options.preAnimationTime, function() {
                        this.$preContainer.hide();
                    }.bind( this ) );
            }
        },

        onShowNextPrePanel: function() {
            if ( this.index < this.count || this.options.loop ) {
                this.$preContainer
                    .show()
                    .css( { right: - this.options.preContainerOffset, left: '' } )
                    .stop()
                    .animate( { right: 0 }, this.options.preAnimationTime )
                    .data( 'move', 'right' );

                this.$activeSlide && this.$activeSlide.hide();
                this.$activeSlide = this.$preSliders.eq( this.getNextIndex() );
                this.$activeSlide.show().css( { left: - this.preContainerCenter } );
            }
        },

        onHideNextPrePanel: function() {
            if ( this.index < this.count || this.options.loop ) {
                this.$preContainer
                    .stop()
                    .animate( { right: - this.options.preContainerOffset }, this.options.preAnimationTime, function() {
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
            if ( this.has3d ) {
                this.$tracker.removeClass( this.options.transition );
                this.$tracker[ 0 ].style[ this.transform ] = 'translateX(0)';
            } else {
                this.$tracker.removeClass( this.options.transition ).css( { left: 0 } );
            }
            this.setStage();
            this.isMoved = false;
        },

        moveByNav: function( direction ) {
            if ( this.isMoved ) {
                return;
            }

            this.setCurrIndex( this.index + direction );
            this.triggerSelectItem( this.index );
            this.move( this.index, direction );
            this.setActiveDot( this.index );
        },

        onMouseEnter: function() {
            clearTimeout( this.timeoutCallback );
        },

        onMouseLeave: function() {
            this.startTimeout();
        },

        onDotClick: function( e ) {
            var newIndex = this.$dotsEls.index( $( e.target ).closest( '.' + this.options.dot ) ),
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
            this.setActiveDot( this.index );
        },

        move: function( to, direction ) {
            this.isMoved = true;
            var directionName = this.$preContainer.data( 'move' ), props = {};
            props[ directionName ] = - this.options.preContainerOffset;
            this.$preContainer.animate( props, this.options.preAnimationTime );

            if ( this.has3d ) {
                this.$tracker.addClass( this.options.transition );
                this.$tracker[ 0 ].style[ this.transform ] = 'translateX(' + ( - direction * this.trackerWidth ) + 'px)';
                this.afterTransition( this.$tracker, 'transform', this.options.moveTime, function() {
                    this.onMoveEnd();
                    console.log( 'transitionEnd' );
                }.bind( this ));
            } else {
                this.$tracker
                    .stop()
                    .animate(
                        { left: - direction * this.trackerWidth + 'px' },
                        this.options.moveTime,
                        this.onMoveEnd.bind( this )
                    );
            }
        },

        setInitialHeight: function () {
            this.$inner.height( this.$el.height() );
        },

        setActiveDot: function( index ) {
            if ( this.options.useDots ) {
                this.$activeDot.removeClass( this.options.dotCurrent );
                this.$activeDot = this.$dotsEls.eq( index ).addClass( this.options.dotCurrent );
            }
        },

        createDots: function() {
            var fragment = document.createDocumentFragment(), dots;
            this.$dotsBox = $( '<ul>' ).addClass( this.options.dots );
            for ( var i = 0, ilen = this.$els.length; i < ilen; i++ ) {
                dots = $( '<li>' ).addClass( this.options.dot ).append( '<i></i>' );
                fragment.appendChild( dots[ 0 ] );
            }
            this.$dotsBox[ 0 ].appendChild( fragment );
            this.$dotsEls = this.$dotsBox.find( '.' + this.options.dot );
            this.$el.append( this.$dotsBox );
            this.$dotsBox.width( this.$dotsBox.width() );
            this.$dotsEls.eq( 0 ).addClass( this.options.dotCurrent );
            this.$dotsBox.css( 'marginLeft', - this.$dotsBox.width() / 2 );
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