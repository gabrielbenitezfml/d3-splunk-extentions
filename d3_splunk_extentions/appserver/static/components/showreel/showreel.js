define(function(require, exports, module) {
  var _ = require("underscore");
  var d3 = require("../d3/d3");
  var SimpleSplunkView = require("splunkjs/mvc/simplesplunkview");
  require("css!./showreel.css");
  var Showreel = SimpleSplunkView.extend({
    className: "splunk-showreel-chart",
    options: {
      "managerid": null,
      "data": "results"
    },
    output_mode: "json",
    initialize: function() {
      SimpleSplunkView.prototype.initialize.apply(this, arguments);

      // Set up resize callback.
      $(window).resize(_.debounce(_.bind(this._handleResize, this), 20));
    },
    _handleResize: function() {
      this.render();
    },
    createView: function() {
      return true;
    },
    // Making the data look how we want it to for updateView to do its job
    formatData: function(data) {
      var formattedData = {data: []};
      var parseDate  = d3.time.format.iso.parse;
      console.log(data);
      data.map(function(d) {
        d._time = parseDate(d._time);
        formattedData.data.push(d);
      });
      return formattedData; // this is passed into updateView as 'data'
    },
    updateView: function(viz, data) {
      console.log(data);

    }
  });
  return Showreel;
});