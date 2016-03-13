(function() {
	var dayIDs = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
	var FC = $.fullCalendar;

	DayTableMixinOverride = {
		// override "FC.DayTableMixin.computeColCnt" method to add rows with resource length
		computeColCnt: function() {
			return FC.DayTableMixin.computeColCnt.apply(this) * this.view.resources.length;
		},
		// override "FC.DayTableMixin.getCellDayIndex" method to reverse col index to day index
		getCellDayIndex: function(row, col) {
			return FC.DayTableMixin.getCellDayIndex.apply(this, [row, col]) + row * this.view.resources.length;
		},
		// override "FC.DayTableMixin.getColDayIndex" method to reverse col index to day index
		getColDayIndex: function(col) {
			var dayIndex = parseInt(col / this.view.resources.length);
			if (this.isRTL) {
				dayIndex = this.daysPerRow - 1 - dayIndex;
			}
			return dayIndex;
		},
		// override "FC.DayTableMixin.renderHeadTrHtml" method to inject resource title col into table header
		renderHeadTrHtml: function() {
			
			return '' +
				FC.DayTableMixin.renderHeadTrHtml.apply(this) +
				'<tr>' +
					(this.isRTL ? '' : this.renderResourceHeadIntroHtml()) +
					this.renderResourceHeadCellsHtml() +
					(this.isRTL ? this.renderResourceHeadIntroHtml() : '') +
				'</tr>';
		},
		// cell renderer for resource title header
		// this method mimics the basicDayGridMethods.renderIntroHtml, FC.DayTableMixin.renderHeadDateCellsHtml, FC.DayTableMixin.renderHeadDateCellHtml
		renderResourceHeadIntroHtml: function() {
			return '<td class="fc-axis" ' + this.view.axisStyleAttr() + '></td>';
		},
		renderResourceHeadCellsHtml: function() {
			var htmls = [];
			var col;

			for (var col = 0; col < this.colCnt; col += this.view.resources.length) {
				date = this.getCellDate(0, col);
				for (r = 0; r < this.view.resources.length; r++) {
					htmls.push(this.renderResourceHeadCellHtml(date, this.view.resources[r]));
				}
			}

			return htmls.join('');
		},
		renderResourceHeadCellHtml: function(date, resource, colspan, otherAttrs) {
			var view = this.view;

			return '' +
				'<th class="fc-day-header ' + view.widgetHeaderClass + ' fc-' + dayIDs[date.day()] + ' fc-resource fc-resource-id' + resource.id  + '"' +
					(this.rowCnt == 1 ?
						' data-date="' + date.format('YYYY-MM-DD') + '"' :
						'') +
					(colspan > 1 ?
						' colspan="' + colspan + '"' :
						'') +
					(otherAttrs ?
						' ' + otherAttrs :
						'') +
				'>' +
					FC.htmlEscape(resource.title) +
				'</th>';
		},
		// override "FC.DayTableMixin.renderHeadDateCellsHtml" method to span date cell
		renderHeadDateCellsHtml: function() {
			var htmls = [];
			var col, date;

			for (var col = 0; col < this.colCnt; col += this.view.resources.length) {
				date = this.getCellDate(0, col);
				htmls.push(this.renderHeadDateCellHtml(date, this.view.resources.length));
			}

			return htmls.join('');
		},
		// override "FC.Grid.eventSpanToSegs" method to shift col of event
		eventSpanToSegs: function(span, event, segSliceFunc) {
			var segs = FC.Grid.prototype.eventSpanToSegs.apply(this, [span, event, segSliceFunc]);

			for (var i = 0; i < segs.length; i++) {
				var shift = 0;
				var seg = segs[i];
				if (seg.event && seg.event.resourceId) {
					shift = this.view.resourcesById[seg.event.resourceId].__index;
				}
				seg.col = seg.col * this.view.resources.length + shift;
			}
			return segs;
		},
		// override "FC.DayGrid.buildSegLevels" method to shift col of event
		buildSegLevels: function(segs) {
			var segLevels = FC.DayGrid.prototype.buildSegLevels.apply(this, [segs]);

			for (var i = 0; i < segLevels.length; i++) {
				var segLevel = segLevels[i];
				for (var j = 0; j < segLevel.length; j++) {
					var seg = segLevel[j];
					var shift = 0;
					if (seg.event && seg.event.resourceId) {
						shift = this.view.resourcesById[seg.event.resourceId].__index;
					}
					seg.leftCol = seg.leftCol * this.view.resources.length + shift;
					seg.rightCol = seg.rightCol * this.view.resources.length + shift;
				}
			}
			return segLevels;
		},
	};
	FC.ResourceTimeGrid = FC.TimeGrid.extend({});
	FC.ResourceTimeGrid.mixin(DayTableMixinOverride);
	FC.ResourceDayGrid = FC.DayGrid.extend({});
	FC.ResourceDayGrid.mixin(DayTableMixinOverride);
	FC.ResourceView = FC.AgendaView.extend({
		resources: [],
		resourcesById: {},
		timeGridClass: FC.ResourceTimeGrid,
		dayGridClass: FC.ResourceDayGrid,
		initialize: function() {
			FC.AgendaView.prototype.initialize.apply(this, arguments);

			this.resources = this.options.resources;
			this.resourcesById = {};
			for (var r = 0; r < this.resources.length; r++) {
				if (!this.resources[r].id) {
					this.resources[r].id = r;
				}
				this.resourcesById[this.resources[r].id] = this.resources[r];
				this.resourcesById[this.resources[r].id].__index = r;
			}
		},
	});
	FC.views.resource = {
		'class': FC.ResourceView,
		defaults: {
			allDaySlot: true,
			allDayText: 'all-day',
			slotDuration: '00:30:00',
			minTime: '00:00:00',
			maxTime: '24:00:00',
			slotEventOverlap: true
		}
	};
	FC.views.resourceDay = {
		'type': 'resource',
		duration: { days: 1 }
	};
	FC.views.resourceWeek = {
		'type': 'resource',
		duration: { week: 1 }
	};
})();
