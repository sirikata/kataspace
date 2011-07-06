/* PrettyPieMenu by Rami Laine
 * 
 * Heavily modified and transformed to JQueryUI widget from 
 * Radial pie menu HTML5 canvas implementation by Andreas Fuchs (2009).
 * 
 */
(function( $, undefined ) {
var piemenuId = 0;

function getNextPieMenuId() {
	return ++piemenuId;
}

$.widget("ui.prettypiemenu", {
	options: {
	    buttons: {},
	    closeRadius: 20,
	    closePadding: 3,
	    outerPadding: 10,
	    globalAlpha: 1.0,
	    onSelection: function() {},
	    className: "ui-ppmenu-pieBg",
	    centerIconInActive: "css/45_red.gif",
	    centerIconActive: "css/45_green.gif",
	    backgroundColor: 'transparent',
	    iconW: 16,
	    iconH: 16,
		centerIconW: 30,
		centerIconH: 30,	    
	    showAnimationSpeed: 300,
	    showStartAnimation: true,
        showTitles: false
	},

	_create: function() {
		var self = this,
		options = self.options;

		// variables
		var idPrefix = self.idPrefix = "piemenu_" + getNextPieMenuId() + "_img_";
		var highlight = self.highlight = 'x';
	    var nSegments = self.nSegments = $(options.buttons).length;
	    var radius = self.radius = self._minRadius(options) + options.closeRadius + options.closePadding;
	    self.showStartAnimation = options.showStartAnimation;
	    
	    // elements
		var pieArea = self.pieArea = $(document.createElement('div'))
		    .appendTo(document.body)
		    .hide()
			.addClass(options.className)
			.css({
				width: radius*2,
				height: radius*2,
				position: "absolute"
			})
			.bind('contextmenu', function(e) {
				e.preventDefault();
				return false;
			});
	
		var tooltip = self.tooltip = $(document.createElement('div'))
		.hide()
		.addClass("ui-widget ui-widget-content ui-ppmenu-tooltip")
		.appendTo($(pieArea))
		.css({
			top: options.closeRadius - options.iconH/2,
			left: options.closeRadius - options.iconW/2
		});
		
		// var ballIconW = 16;
		// var ballIconH = 16;
		
		var ballIcon = self.ballIcon = $(document.createElement('span'))
			.hide()
			.addClass("ui-icon ui-icon-radio-off")
			.appendTo($(pieArea))
			.css({
				top: options.closeRadius - options.iconH/2,
				left: options.closeRadius - options.iconW/2,
				position: "absolute"
			});

		var centerIcon = self.centerIcon = $(document.createElement('img'))
			.attr("src", options.centerIconInActive)
			.appendTo($(pieArea))
			.css({
				top: radius - options.centerIconH/2,
				left: radius - options.centerIconW/2,
				position: "absolute",
				border: 0
			});

		// segments
		$(options.buttons).each( function(i, img) {
			var pos = self._iconPos(radius, i, nSegments, options.outerPadding, options, 50, 2);
			var pieSegment = $(document.createElement("div"))
				.appendTo($(pieArea))
				.addClass("ui-ppmenu-iconBg ui-state-hover")
				.css({
					top:  pos.top,
					left: pos.left,
					width: options.iconW,
					height: options.iconH
				});

			var pieSegmentIcon = $(document.createElement("span"))
				.attr( { id: idPrefix + i })
				.appendTo($(pieSegment))
				.addClass("ui-icon " + img.img);
		});		
		
		$(self.element).mousedown(function(e) {
			e.preventDefault();
			if (e.which == 3)
			{
				// checking if the menu if going outside the window
				if (e.pageX - radius < 0)
				{
					self.show({left: e.pageX - (e.pageX - radius), top: e.pageY});
				}
				else if (e.pageX + radius > $(window).width())
				{
					self.show({left: e.pageX - (e.pageX + radius - $(window).width()), top: e.pageY});
				}
				else
				{
					self.show({left: e.pageX, top: e.pageY});
				}
			}
			return false;
		});
	},

	_init: function() {
		var self = this,
		options = self.options;

		// variables
		var highlight = self.highlight = 'x';
	    var nSegments = self.nSegments = $(options.buttons).length;
	    var radius = self.radius = self._minRadius(options) + options.closeRadius + options.closePadding;
	    self.showStartAnimation = options.showStartAnimation;
	},
	hide: function() {
		var self = this;	
		
		$(self.options.buttons).each( function(i, img) {   
			var pos = self._iconPos(self.radius, i, self.nSegments, self.options.outerPadding, self.options, 50, 2);
			$("#" + self.idPrefix + i).parent().animate({ top: pos.top, left: pos.left }, 500);
			$("#" + self.idPrefix + i).parent().switchClass("ui-state-active", "ui-state-hover", 0);
		});
		
		self.pieArea.fadeOut(400, function() {
			$(document.body).unbind('contextmenu');
			return false;
		});
		
		self.ballIcon.hide();
		self.tooltip.hide();
		self.centerIcon.attr("src", self.options.centerIconInActive);

		return self;
	},
	_unbindEvents: function() {
		var self = this;		
		self.pieArea.unbind('mousemove').unbind('mouseup');
		$(document.body).unbind('mouseup.ppmenu');
		$(document.body).unbind('mousemove.ppmenu');
	},
	destroy: function() {
		this._unbindEvents();
		this.hide();
		return self;
	},

	widget: function() {
		return this.pieArea;
	},

    _innerSegmentAngle: function(n) {
        return this._paddedSegmentAngle(n) - (Math.PI/180)*4;
    },

    _paddedSegmentAngle: function(n) {
        return 2*Math.PI / n;
    },

    _startAngle: function (n, total) {
        return (-Math.PI/2) + this._paddedSegmentAngle(total) * n;
    },

   _endAngle: function(n, total) {
       return this._startAngle(n, total) + this._innerSegmentAngle(total);
   },
   _iconPos: function(radius, i, nSegments, outerPadding, options, animPaddingOffset, animAngleOffset) {
		 var startA = this._startAngle(i, nSegments), endA = this._endAngle(i, nSegments);
		 // var iconW = $(img).width(), iconH = $(img).height();
		 var iconW = this.options.iconW, iconH = this.options.iconH;
		 var iconCenterRadius = radius - Math.max(iconW, iconH)/2-outerPadding + animPaddingOffset;
		 var midAngle = startA + (endA - startA)/2 + animAngleOffset,
		 iconX = Math.cos(midAngle) * iconCenterRadius,
		 iconY = Math.sin(midAngle) * iconCenterRadius;  
		 
		 return {top: radius + iconY-iconH/2, left: radius + iconX-(iconW/2)};
   },
   _minRadius: function(options) {
	   var diagonal = 0, maxside = 0;
	   $(options.buttons).each( function(_, img) {
		   // var w = $(img).width(), h = $(img).height();
		   var w = options.iconW, h = options.iconH;
		   diagonal = Math.max(diagonal, Math.sqrt(w*w + h*h));
		   maxside = Math.max(maxside, w, h);
	   });
	   var segmentAngle = this._paddedSegmentAngle($(options.buttons).length);
	   var dHalved = diagonal/2, alpha = (Math.PI - segmentAngle) / 2;
	   return Math.ceil(dHalved * Math.sin(alpha) +
			   Math.max(dHalved, maxside) + options.outerPadding);

   },
   show: function(position) {
	   var self = this;
	   
	   self.highlight = 'x';	   
	   self.pieArea.css({
	       top: position.top - self.radius,
	       left: position.left - self.radius
	   });
	   
	   $(document.body).bind('contextmenu', function(e) {
			e.preventDefault();
			return false;
		}, false);
	   
	   // binds
	   $(document.body).bind('mouseup.ppmenu', function(event) {
		   							event.preventDefault();
		   							self.destroy(event);
		   							return false;
		   						 }, false); 
	   $(document.body).bind('mousemove.ppmenu', function(event) {
		   		event.preventDefault();
		   		self._changeHighlight(event);
		   		return false;
			 }, false);
	   
	   self.pieArea.mousemove(function(event) {
			self._changeHighlight(event); 
		}, false)
		.bind('mouseup', self.options, function(event) {
			self._onClick(event); 
		}, false);	   
	   
	   self.pieArea.fadeIn(self.options.showAnimationSpeed);
	   self.showStartAnimation = self.options.showStartAnimation;;

	   $(self.options.buttons).each( function(i, img) {   
		   var pos = self._iconPos(self.radius, i, self.nSegments, self.options.outerPadding, self.options, 50, 2);
		   $("#" + self.idPrefix + i).parent().css({ top: pos.top, left: pos.left });
	   });	
	   
	   self._draw();
   },
   _draw: function() {
	   var self = this;

	   // Draw segments
	   $(self.options.buttons).each( function(i, img) {
		   var icon = $("#" + self.idPrefix + i);

		   if (self.showStartAnimation)
		   {
			   var pos = self._iconPos(self.radius, i, self.nSegments, self.options.outerPadding, self.options, 0, 0);
			   $(icon).parent().animate({ top: pos.top, left: pos.left }, self.options.showAnimationSpeed, 
					   					  function() { self.highlight = 'x'; });
		   }

		   if (i === self.highlight)
		   {
			   $(icon).parent().switchClass("ui-state-hover", "ui-state-active", 0);
			   if (self.options.showTitles)
			   {
				   var tooltipPos = self._iconPos(self.radius, i, self.nSegments, self.options.outerPadding, self.options, 0, 0);
				   self.tooltip.html(img.title);
				   var tooltipLeftside  = { top: tooltipPos.top, left: tooltipPos.left - self.tooltip.width() - self.options.iconW*2 }
				   var tooltipRightside = { top: tooltipPos.top, left: tooltipPos.left + self.options.iconW*2 }
				   
				   if (tooltipPos.left < self.radius)
				   {
					   tooltipPos = tooltipLeftside;
				   }
				   else
				   {
					   tooltipPos = tooltipRightside;
				   }
				   
				   // have to calculate if the title is going outside of the window				   
				   self.tooltip.animate({
					   top:  tooltipPos.top,
					   left: tooltipPos.left
				   }, 300, function() { 
					   if (self.tooltip.offset().left < 0)
					   {
						   self.tooltip.css({top: tooltipRightside.top, left: tooltipRightside.left});
					   }
					   else if (self.tooltip.offset().left + self.tooltip.width() > $(window).width())
					   {
						   self.tooltip.css({top: tooltipLeftside.top, left: tooltipLeftside.left});
					   }
				   });


			   }
		   }
		   else
		   {
			   $(icon).parent().switchClass("ui-state-active", "ui-state-hover", 0);
		   }
	   });
	   self.showStartAnimation = false;
   },	
   _onClick: function(e){
       var self = this;
	   
       self._unbindEvents();	   
	   
	   if (self.highlight >= 0 && self.highlight < self.nSegments) 
	   {
		   if (e.data.onSelection)
		   {
			   e.data.onSelection(self.highlight, self.element, e);
		   }
	   }
	   else if (e.data.onAbort)
	   {
	       e.data.onAbort(self.element, e);
	   }
	   
	   self.hide();
   },
   _changeHighlight: function(e) {
        var self = this;
        var prevHighlight = self.highlight;
        var posn = self.pieArea.offset();
        var x = e.pageX - posn.left, y = e.pageY - posn.top;
        var cX = self.pieArea.width()/2, cY = self.pieArea.height()/2;
        var centerDistance = Math.sqrt((cX - x)*(cX - x) + (cY - y)*(cY - y));
        
        if (centerDistance < self.options.closeRadius) 
        {
        	// mouse at center
        	self.highlight = 'x';
        	if (self.highlight != prevHighlight)
        	{
        		self._draw();
        		self.centerIcon.attr("src", self.options.centerIconInActive);
        		self.ballIcon.hide();   
        		self.tooltip.fadeOut();
        	}
        } 
        else if (centerDistance > self.options.closeRadius + self.options.closePadding) 
        {
            var dX = x - cX, dY = y - cY;
            var angle = null;
            if (dX < 0)
                angle = Math.PI + Math.asin(-dY/centerDistance);
            else
                angle = Math.asin(dY/centerDistance);

            $(self.options.buttons).each( function(i, img) {
            	if (self._startAngle(i, self.nSegments) < angle &&
            		self._endAngle(i, self.nSegments) >= angle) 
            	{
            		self.highlight = i;
            		return false;
            	}
            	return true;
            });
            
            // change icon to active and show ball if necessary
            if (self.highlight != prevHighlight)
            {
            	self._draw();
            }

            if (centerDistance > self.radius + self.options.outerPadding)
            {
            	if (self.centerIcon.attr("src") != self.options.centerIconInActive)
            	{	
            		self.centerIcon.attr("src", self.options.centerIconInActive);
            		self.tooltip.fadeOut();
            	}
            }
            else
            {
            	if (self.centerIcon.attr("src") != self.options.centerIconActive)
            	{	 
            		self.centerIcon.attr("src", self.options.centerIconActive);
            		self.ballIcon.show();
     			    if (self.options.showTitles)
    			    {
     			    	self.tooltip.fadeIn();
    			    }
            	}
            }
            
            
            var ballPosX = Math.cos(angle)*(self.options.closeRadius);
            var ballPosY = Math.sin(angle)*(self.options.closeRadius);

            self.ballIcon.css({
            	top:  self.radius + ballPosY - self.options.iconH/2,
            	left: self.radius + ballPosX - self.options.iconW/2
            });
        }

        
        return false;
    }	
});

$.extend($.ui.prettypiemenu, {
	version: "1.8.8"
});

}(jQuery));
