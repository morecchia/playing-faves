$(document).ready(function($) {
    $('.lightbox_trigger').live('click', function() {
	   
        //Get clicked img src
        var image_src = $(this).attr("src");
		
        //If the lightbox window HTML doesn't exists, create it and insert it.
        if ($('#lightbox').length > 0) {
		
            //place href as img src value
            $('#content').html('<img src="' + image_src + '" />');
			
            //show lightbox window - you could use .show('fast') for a transition
            $('#lightbox').fadeIn(500);
			
        } else {
		
            //create HTML markup for lightbox window
            var lightbox =
            '<div id="lightbox">' +
                '<div id="content">' + //insert clicked link's href into img src
                    '<img src="' + image_src +'" />' + 
                '</div>' +
            '</div>';
			
            //insert lightbox HTML into page
            $('#soundcloud').append(lightbox);
			
        }
		
    });
	
    //Click anywhere on the page to get rid of lightbox window
    $('#list, #lightbox').live('click', function() {
	
        $('#lightbox').fadeOut(500);
		
    });
	
});
