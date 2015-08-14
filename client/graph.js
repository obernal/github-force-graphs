

function graph(json_url, callback) {
  $('#submit-button').button('loading');
  //just for now to test
  if (this.stop_timer != undefined){
    stop_timer();
  }

  d3.json(json_url, function(error, graph) {
    $('#graph').empty();
    $('#submit-button').button('reset');

    var width = 400 * Math.round(Math.log(graph.nodes.length)/Math.LN10) * 1.5;
    var height = 300 * Math.round(Math.log(graph.nodes.length)/Math.LN10) * 1.5;

    var force = d3.layout.force()
    .charge(-600)
    .linkDistance(100)
    .size([width, height]);

    var svg = d3.select("#graph").append("svg")
    .attr("width", width)
    .attr("height", height);

    var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-3, 0])
    .html(function (d) {
      if (d.filename != undefined){
        return '<span>file: </span>' + d.filename ;
      }else{
        return '<span>user: </span>' + d.login ;
      }

    })
    svg.call(tip);

    callback(true);
    if (error) throw error;

    force
    .nodes(graph.nodes)
    .links(graph.links)
    .gravity(0.5)
    .start();

    var user_nodes = graph.nodes.filter(function(e) {
      return e.login != undefined;
    });

    svg.append('defs').attr("id", "imgdefs").selectAll('pattern')
    .data(user_nodes)
    .enter().append("pattern")
    .attr("id", function(d){ return (d.login)?d.login:d.filename; })
    .attr("height", 1)
    .attr("width", 1)
    .attr("x", "0")
    .attr("y", "0")
    .append("image")
    .attr("x", 0)
    .attr("y", 0)
    .attr("height", function(d){
      if (d.login != undefined){
        return Math.log(d.weight + 10)*10;
      }else{
        return Math.log(d.weight + 10)*8;
      }
    })
    .attr("width", function(d)	{
      if (d.login != undefined){
        return Math.log(d.weight+ 10)*10;
      }else{
        return Math.log(d.weight+ 10)*8 ;
      }
    })
    .attr("xlink:href", function(d){
      if (d.avatar_url){
        return d.avatar_url;
      }
    });

    var link = svg.selectAll(".link")
    .data(graph.links)
    .enter().append("line")
    .attr("class", "link")
    .style("stroke-width", function(d) { return Math.sqrt(d.value); });

    var node = svg.selectAll(".node")
    .data(graph.nodes)
    .enter().append("g")
    .attr("class", "node")
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide)


    node.on( 'click', function (d) {
      if (d.login != undefined){
        d3.select("h1").html("<a href='" + d.html_url + "' >"  + d.login + " <small>Github profile ⇢</small> "+ "</a>");
      }else{
        d3.select("h1").html("<a href='" + d.raw_url + "' >"  + d.filename + " <small>raw ⇢</small>"+ "</a>");
      }
    })

    var file_node = node.filter(function(d){
      return (d.filename != undefined);
    });

    file_node.append('svg:image')
    //.attr('onload', function() {
    //     alert('loaded');
    //})
    .attr("xlink:href", function(d){
      if (endsWith(d.filename, "html")){
        return "file-icons/PNG/html.png";
      }else if (endsWith(d.filename, "png")){
        return "file-icons/PNG/png.png";
      }else if (endsWith(d.filename, "jpg")){
        return "file-icons/PNG/jpg.png";
      }else if (endsWith(d.filename, "js")){
        return "file-icons/PNG/js.png";
      }else if (endsWith(d.filename, "css") || endsWith(d.filename, "scss")){
        return "file-icons/PNG/css.png";
      }else if (endsWith(d.filename, "java")){
        return "file-icons/PNG/java.png";
      }else if (endsWith(d.filename, "scala")){
        return "file-icons/PNG/scala.png";
      }else{
        return "file-icons/PNG/txt.png";
      }
    })
    .attr("x", function(d){ return -(Math.log(d.weight+ 10)*8)/2 })
    .attr("y", function(d){ return -(Math.log(d.weight+ 10)*8)/2 })
    .attr('width', function(d){ return Math.log(d.weight+ 10)*8})
    .attr('height', function(d){ return Math.log(d.weight+ 10)*8 })
    //.style("fill", function(d) { return "url(#" + d.filename + ")"; })
    .style("stroke-width","0")

    var user_node = node.filter(function(d){
      return (d.login != undefined);
    });

    user_node.append("circle")
    //.attr("class", "node")
    .attr("r", function(d){ return Math.log(d.weight+ 10)*5 })
    .style("fill", function(d) { return (d.login)?"url(#" + d.login + ")":"url(#" + d.filename + ")"; })


    node.append("title")
    .text(function(d) { return d.login?d.login:d.filename; });
    node.call(force.drag);

    force.on("tick", function() {
      link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

      //node.attr("cx", function(d) { return d.x; })
      //    .attr("cy", function(d) { return d.y; });
      node
      .attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")"; });
      });
    });

  }

  function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  }
