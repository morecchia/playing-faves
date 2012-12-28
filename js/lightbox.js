$(document).ready(function () {
	
	$("#artwork img").live("click", function() { 	
 	
	    //Get clicked img src and try to create original artwork url
 	
	    var image_src = $(this).attr("src");
		
			imgExists = image_src != null;
				
			var thumbnail = function() {

				if (imgExists) {
				
					var art = image_src.replace("large","original");
					return art;

				} else {

					return false;

				}
					
			};

 	
	    //If the lightbox window HTML doesn't exists, create it and insert it.
 	
	    if ($("#lightbox").length > 0) {
 	
	        $("#content").html("<img src='" + thumbnail() + "' />");
 	
	        $("#lightbox").fadeIn(500);
 	
	    } else {
 	
	        //create HTML markup for lightbox window
 	
	        var lightbox =
 	
	        "<div id='lightbox'>" +
 	
	            "<div id='content'>" + //insert clicked link's href into img src
 	
	                "<img src='" + thumbnail() + "' />" + 
 	
	            "</div>" +
 	
	        "</div>";
 	
	        //insert lightbox HTML into page
 	
	        $("#soundcloud").append(lightbox);
 	
	    }
 		
	});
 	
	//Click anywhere on the page to get rid of lightbox window
 	
	$("#list, #lightbox").live("click", function() {
 	
	    $("#lightbox").fadeOut(500);
 	
	});
	
});
