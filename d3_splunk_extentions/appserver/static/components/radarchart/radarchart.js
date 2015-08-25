/**
 * Created by berniem on 8/24/15.
 */

define(function(require, exports, module) {
  var _ = require("underscore");
  var d3 = require("../d3/d3");
  var SimpleSplunkView = require("splunkjs/mvc/simplesplunkview");
  require("css!./radarchart.css");
  var Radarchart = SimpleSplunkView.extend({
    className: "splunk-radar-chart",
    options: {
      "managerid": null,
      "data": "preview",
      "legendTitle": null,

    },
    output_mode: "json",
    initialize: function() {
      SimpleSplunkView.prototype.initialize.apply(this, arguments);
    },
    createView: function() {
      return true;
    },
    // Making the data look how we want it to for updateView to do its job
    formatData: function(data) {
      var formattedData = {};
      var axisColumn = this.settings.get('axis');
      var axis;

      data.map(function(d) {
        axis = d[axisColumn];
        _.each(d, function(val, key){
          if(key != axisColumn){
            if (!formattedData.hasOwnProperty(key)) {
              formattedData[key] = [];
            }
            formattedData[key].push({axis: axis, value: val})
          }
        });
      });

      return formattedData; // this is passed into updateView as 'data'
    },
    updateView: function(viz, data) {
      console.log('hello');
      this.$el.html("");
      var id = this.id;
      var parent = $("#"+id).parent();
      var width = parent.width();
      var chartConfig = {
        w: Number(this.settings.get('width')) || 400,
        h: Number(this.settings.get('height')) || 400,
        ExtraWidthX: Number(this.settings.get('ExtraWidthX')) || 200,
        ExtraWidthY: Number(this.settings.get('ExtraWidthY')) || 100,
        opacityArea: Number(this.settings.get('opacityArea')) || 0.5,
        levels: Number(this.settings.get('levels')) || 5,
        legendTitle: this.settings.get('legendTitle') || ''
      };
      var colorscale = d3.scale.category10();;
      var LegendOptions = [];
      var d = [];

      function radarchart(data, id, parentid, options){
        console.log(id,parentid)
        var cfg = {
          radius: 5,
          w: 400,
          h: 400,
          factor: 1,
          factorLegend: .85,
          levels: 5,
          maxValue: 0.6,
          radians: 2 * Math.PI,
          opacityArea: 0.5,
          ToRight: 5,
          TranslateX: 60,
          TranslateY: 30,
          ExtraWidthX: 200,
          ExtraWidthY: 100,
          color: d3.scale.category10()
        };

        if('undefined' !== typeof options){
          for(var i in options){
            if('undefined' !== typeof options[i]){
              cfg[i] = options[i];
            }
          }
        }

        _.each(data, function(val, key) {
          LegendOptions.push(key);
          d.push(val);
          });

        console.log(LegendOptions);

        cfg.maxValue = Math.max(cfg.maxValue, d3.max(d, function(i){return d3.max(i.map(function(o){return o.value;}))}));
        var allAxis = (d[0].map(function(i, j){return i.axis}));
        var total = allAxis.length;
        var radius = cfg.factor*Math.min(cfg.w/2, cfg.h/2);
        var Format = d3.format('d');
        d3.select(id).select("svg").remove();

        var g = d3.select(id)
          .append("svg")
          .attr("width", cfg.w+cfg.ExtraWidthX)
          .attr("height", cfg.h+cfg.ExtraWidthY)
          .append("g")
          .attr("transform", "translate(" + cfg.TranslateX + "," + cfg.TranslateY + ")");


        var tooltip;

        //Circular segments
        for(var j=0; j<cfg.levels-1; j++){
          var levelFactor = cfg.factor*radius*((j+1)/cfg.levels);
          g.selectAll(".levels")
            .data(allAxis)
            .enter()
            .append("svg:line")
            .attr("x1", function(d, i){return levelFactor*(1-cfg.factor*Math.sin(i*cfg.radians/total));})
            .attr("y1", function(d, i){return levelFactor*(1-cfg.factor*Math.cos(i*cfg.radians/total));})
            .attr("x2", function(d, i){return levelFactor*(1-cfg.factor*Math.sin((i+1)*cfg.radians/total));})
            .attr("y2", function(d, i){return levelFactor*(1-cfg.factor*Math.cos((i+1)*cfg.radians/total));})
            .attr("class", "line")
            .style("stroke", "grey")
            .style("stroke-opacity", "0.75")
            .style("stroke-width", "0.3px")
            .attr("transform", "translate(" + (cfg.w/2-levelFactor) + ", " + (cfg.h/2-levelFactor) + ")");
        }

        //Text indicating at what % each level is
        for(var j=0; j<cfg.levels; j++){
          var levelFactor = cfg.factor*radius*((j+1)/cfg.levels);
          g.selectAll(".levels")
            .data([1]) //dummy data
            .enter()
            .append("svg:text")
            .attr("x", function(d){return levelFactor*(1-cfg.factor*Math.sin(0));})
            .attr("y", function(d){return levelFactor*(1-cfg.factor*Math.cos(0));})
            .attr("class", "legend")
            .style("font-family", "sans-serif")
            .style("font-size", "10px")
            .attr("transform", "translate(" + (cfg.w/2-levelFactor + cfg.ToRight) + ", " + (cfg.h/2-levelFactor) + ")")
            .attr("fill", "#737373")
            .text(Format((j+1)*cfg.maxValue/cfg.levels));
        }

        series = 0;

        var axis = g.selectAll(".axis")
          .data(allAxis)
          .enter()
          .append("g")
          .attr("class", "axis");

        axis.append("line")
          .attr("x1", cfg.w/2)
          .attr("y1", cfg.h/2)
          .attr("x2", function(d, i){return cfg.w/2*(1-cfg.factor*Math.sin(i*cfg.radians/total));})
          .attr("y2", function(d, i){return cfg.h/2*(1-cfg.factor*Math.cos(i*cfg.radians/total));})
          .attr("class", "line")
          .style("stroke", "grey")
          .style("stroke-width", "1px");

        axis.append("text")
          .attr("class", "legend")
          .text(function(d){return d})
          .style("font-family", "sans-serif")
          .style("font-size", "11px")
          .attr("text-anchor", "middle")
          .attr("dy", "1.5em")
          .attr("transform", function(d, i){return "translate(0, -10)"})
          .attr("x", function(d, i){return cfg.w/2*(1-cfg.factorLegend*Math.sin(i*cfg.radians/total))-60*Math.sin(i*cfg.radians/total);})
          .attr("y", function(d, i){return cfg.h/2*(1-Math.cos(i*cfg.radians/total))-20*Math.cos(i*cfg.radians/total);});


        d.forEach(function(y, x){
          dataValues = [];
          g.selectAll(".nodes")
            .data(y, function(j, i){
              dataValues.push([
                cfg.w/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total)),
                cfg.h/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total))
              ]);
            });
          dataValues.push(dataValues[0]);
          g.selectAll(".area")
            .data([dataValues])
            .enter()
            .append("polygon")
            .attr("class", "radar-chart-serie"+series)
            .style("stroke-width", "2px")
            .style("stroke", cfg.color(series))
            .attr("points",function(d) {
              var str="";
              for(var pti=0;pti<d.length;pti++){
                str=str+d[pti][0]+","+d[pti][1]+" ";
              }
              return str;
            })
            .style("fill", function(j, i){return cfg.color(series)})
            .style("fill-opacity", cfg.opacityArea)
            .on('mouseover', function (d){
              z = "polygon."+d3.select(this).attr("class");
              g.selectAll("polygon")
                .transition(200)
                .style("fill-opacity", 0.1);
              g.selectAll(z)
                .transition(200)
                .style("fill-opacity", .7);
            })
            .on('mouseout', function(){
              g.selectAll("polygon")
                .transition(200)
                .style("fill-opacity", cfg.opacityArea);
            });
          series++;
        });
        series=0;


        d.forEach(function(y, x){
          g.selectAll(".nodes")
            .data(y).enter()
            .append("svg:circle")
            .attr("class", "radar-chart-serie"+series)
            .attr('r', cfg.radius)
            .attr("alt", function(j){return Math.max(j.value, 0)})
            .attr("cx", function(j, i){
              dataValues.push([
                cfg.w/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total)),
                cfg.h/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total))
              ]);
              return cfg.w/2*(1-(Math.max(j.value, 0)/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total));
            })
            .attr("cy", function(j, i){
              return cfg.h/2*(1-(Math.max(j.value, 0)/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total));
            })
            .attr("data-id", function(j){return j.axis})
            .style("fill", cfg.color(series)).style("fill-opacity", .9)
            .on('mouseover', function (d){
              newX =  parseFloat(d3.select(this).attr('cx')) - 10;
              newY =  parseFloat(d3.select(this).attr('cy')) - 5;

              tooltip
                .attr('x', newX)
                .attr('y', newY)
                .text(Format(d.value))
                .transition(200)
                .style('opacity', 1);

              z = "polygon."+d3.select(this).attr("class");
              g.selectAll("polygon")
                .transition(200)
                .style("fill-opacity", 0.1);
              g.selectAll(z)
                .transition(200)
                .style("fill-opacity", .7);
            })
            .on('mouseout', function(){
              tooltip
                .transition(200)
                .style('opacity', 0);
              g.selectAll("polygon")
                .transition(200)
                .style("fill-opacity", cfg.opacityArea);
            })
            .append("svg:title")
            .text(function(j){return Math.max(j.value, 0)});

          series++;
        });
        //Tooltip
        tooltip = g.append('text')
          .style('opacity', 0)
          .style('font-family', 'sans-serif')
          .style('font-size', '13px');


        //Creates Legend
        var svg = d3.select(parentid)
          .selectAll('svg')
          .append('svg')
          .attr("width", cfg.w+300)
          .attr("height", cfg.h)

        //Create the title for the legend
        var text = svg.append("text")
          .attr("class", "title")
          .attr('transform', 'translate(90,0)')
          .attr("x", cfg.w - 70)
          .attr("y", 10)
          .attr("font-size", "12px")
          .attr("fill", "#404040")
          .text(cfg.legendTitle);

        //Initiate Legend
        var legend = svg.append("g")
            .attr("class", "legend")
            .attr("height", 100)
            .attr("width", cfg.w+300)
            .attr('transform', 'translate(90,20)');

        //Create colour squares
        legend.selectAll('rect')
          .data(LegendOptions)
          .enter()
          .append("rect")
          .attr("x", cfg.w - 65)
          .attr("y", function(d, i){ return i * 20;})
          .attr("width", 10)
          .attr("height", 10)
          .style("fill", function(d, i){ return colorscale(i);});

        //Create text next to squares
        legend.selectAll('text')
          .data(LegendOptions)
          .enter()
          .append("text")
          .attr("x", cfg.w - 52)
          .attr("y", function(d, i){ return i * 20 + 9;})
          .attr("font-size", "11px")
          .attr("fill", "#737373")
          .text(function(d) { return d; });

      }
      console.log(parent);


      radarchart(data,'#'+id, '#'+id, chartConfig);
      //////
    }
  });
  return Radarchart;
});