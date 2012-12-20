$(document).ready(function () {

	// initialize the soundcloud api
	SC.initialize({	
		client_id: "2170b66abbf8f1381aedd4111f5c5a12",
		redirect_uri: "http://tonefolder.com/callback.html"
	});
	
	var track, //the current track loaded into the player
		latest, //the latest track
		track_url, //the current track's stream_url
		user = "mporecchia", //current user
		replacement_img = "images/sc_transparent.png", //image placeholder for tracks w/o artwork
		list_size = 30, //num of tracks per initial user favorite list
		user_size = 50, //number of follower/following users per initial page load
		offset;
	
	var Info = {
		
		user: function(user) {

			var url = "/users/" + user;
			
			SC.get (url, function(data) {
			
				$(".userinfo .info_user a")
					.text(data.username)
						.attr("href", data.permalink_url)
							.attr("target", "_blank");
			
			});
			
		},
		
		current: function(track_url) {
			
			SC.get (track_url, function(data) {
					
				$(".current_track .track_name")
					.text(data.title)
						.attr("title", data.description);
				
				$(".current_track .info_user a")
					.text(data.user.username)
						.attr("href", data.user.permalink_url)
							.attr("target", "_blank");
			
			});
			
		}
	
	};
	
	//create methods for streaming activity
	var Player = {
		
		init: function(user) {
			
			var url = "/users/" + user + "/favorites/";
			
			SC.get(url, {limit:1}, function(data) {
				
				$.map(data, function(track) {
					
					track_url = "/tracks/" + track.id;
					
					Info.current(track_url);
					
					var oEmbed_url = track.permalink_url;
				
					SC.oEmbed(oEmbed_url, function(oEmbed) {
				
						$("#player").html(oEmbed.html);

					});
				
				});
				
			});

		},
		
		embed: function(track_url) {
			
			SC.get(track_url, function(track) {
				
				var oEmbed_url = track.permalink_url;
				
				SC.oEmbed(oEmbed_url, {auto_play:true}, function(oEmbed) {
				
					$("#player").html(oEmbed.html)
				
				});
				
			});

		}
	
	};
	
	var Following = {
	
		init: function ( config ) {
			
			this.template = config.template;
			this.container = config.container;
			
			this.users();

		},
		
		attachTemplate: function() {
			var template = Handlebars.compile( this.template );
			this.container.append( template( this.items ) );
		},
		
		users: function() {
		
			var self = this;
			
			SC.get("/users/" + user + "/followings", {limit: user_size}, function( data ) {
			
				self.items = $.map( data, function( user ) {
					
					var has_favorites = user.public_favorites_count > 0;
					
					if ( has_favorites ) {
						
						return {
							
							user: user.username,
							favorites: user.public_favorites_count,
							avatar: user.avatar_url,
							id: user.id
							
						};
						
					}
				});
				
			self.attachTemplate();
			
			});
		
		},
		
		page: function(offset) {
		
			var self = this;
			
			SC.get("/users/" + user + "/followers", {limit: user_size, offset: offset}, function( data ) {
			
				self.items = $.map( data, function( user ) {
					
					var has_favorites = user.public_favorites_count > 0;
					
					if ( has_favorites ) {
						
						return {
							
							user: user.username,
							favorites: user.public_favorites_count,
							avatar: user.avatar_url,
							id: user.id
							
						};
						
					}
				});
				
			self.attachTemplate();
			
			});
		
		}
	};
	
	var Followers = {
		
		init: function ( config ) {
			
			this.template = config.template;
			this.container = config.container;
			
			this.users();
			
		},
		
		attachTemplate: function() {
			var template = Handlebars.compile( this.template );
			this.container.append( template( this.items ) );
		},
		
		users: function() {
		
			var self = this;
			
			SC.get("/users/" + user + "/followers", {limit: user_size}, function( data ) {
			
				self.items = $.map( data, function( user ) {
					
					var has_favorites = user.public_favorites_count > 0;
					
					if ( has_favorites ) {
					
						return {
							
							user: user.username,
							favorites: user.public_favorites_count,
							avatar: user.avatar_url,
							id: user.id
							
						};
					
					}
				
				});
				
			self.attachTemplate();
			
			});
		
		},
		
		page: function(offset) {
		
			var self = this;
			
			SC.get("/users/" + user + "/followers", {limit: user_size, offset: offset}, function( data ) {
			
				self.items = $.map( data, function( user ) {
					
					var has_favorites = user.public_favorites_count > 0;
					
					if ( has_favorites ) {
						
						return {
							
							user: user.username,
							favorites: user.public_favorites_count,
							avatar: user.avatar_url,
							id: user.id
							
						};
						
					}
				});
				
				self.attachTemplate();
			
			});
		
		}
		
	};
	
	//create methods for populating the tracklist
	var List = {
		init: function( config ) {
			this.url = config.url;
			this.template = config.template;
			this.container = config.container;		

			$("#list a").remove();
			
			this.fetch();
		},
		attachTemplate: function() {
			var template = Handlebars.compile( this.template );
			this.container.append( template( this.items ) );
		},
		fetch: function() {
			
			var self = this;
			console.log(this.url);
			SC.get( this.url, {limit: list_size}, function( data ) {
											
				self.items = $.map( data, function( tracks ) {

					var datestr = tracks.created_at,
					date = datestr.substring(0,10),
					img_exists = tracks.artwork_url != null;
					
					var thumbnail = function() {
						
						if (img_exists) {
							
							return tracks.artwork_url;
							
						} else {
							
							return replacement_img;
						
						}
		
					};

					return {
						title: tracks.title,
						id: tracks.id,
						thumb: thumbnail(),
						description: tracks.description,
						user: tracks.user.username,
						created: date,
						genre: tracks.genre,
						tags: tracks.tag_list,
						license: tracks.license
					};
				});
				
				self.attachTemplate(); 

			});
		},
		
		page: function(offset) {
		
			var self = this;
			
			SC.get( this.url, {limit: list_size, offset: offset }, function( data ) {
											
				self.items = $.map( data, function( tracks ) {

					var datestr = tracks.created_at,
					date = datestr.substring(0,10),
					img_exists = tracks.artwork_url != null;
					
					var thumbnail = function() {
						
						if (img_exists) {
							
							return tracks.artwork_url;
							
						} else {
							
							return replacement_img;
						
						}
		
					};

					return {
						title: tracks.title,
						id: tracks.id,
						thumb: thumbnail(),
						description: tracks.description,
						user: tracks.user.username,
						created: date,
						genre: tracks.genre,
						tags: tracks.tag_list,
						license: tracks.license
					};
					
				});
				
				self.attachTemplate(); 
				
			});
		
		}
		
	};
	
	//initialize the info bar
	Info.user(user);
	
	//embed the player
	Player.init(user);
	
	//initialize the tracklist
	List.init({
		url: "/users/" + user + "/favorites",
		template: $('#list-template').html(),
		container: $('#list')
	});
	
	Following.init({	
		template: $('#following-template').html(),
		container: $('#following')	
	});
	
	Followers.init({
		template: $('#followers-template').html(),
		container: $('#followers')	
	});
	
	$("#list").on("click", "a", function() {
		
		var id = this.id,
		track_url = "/tracks/" + id;
		
		Player.embed(track_url);
		Info.current(track_url);
		
	});		
	
	//save for later
	$('#username').submit(function(event){
	
		var userinput = $('#userinput').val();
		
		//initialize the tracklist
		List.init({
			url: "/users/" + userinput + "/favorites",
			template: $('#list-template').html(),
			container: $('#list')
		});
	
		event.preventDefault();
	});
	
	$(".userlist").on("click", "a", function() {
		
		var user = this.id;
		
		console.log(user);

		Info.user(user);
		
		//initialize the tracklist
		List.init({
			url: "/users/" + user + "/favorites",
			template: $('#list-template').html(),
			container: $('#list')
		});
		
		$('html, body').animate({scrollTop:0}, "slow");
		
	});

	$("#list_page").click( function() {
		
		var size = $("#list a").length;
		
		offset = size;
		
		List.page(offset);

	});
	
	$("a#user_page").click( function() {
		
		var size = $("#users a").length;
		
		offset = size;
		
		Following.page(offset);
		Followers.page(offset);

	});
	
	//$("input:submit, #switch_user button").button();
	$("#list, #users, #info").tooltip( { tooltipClass: "custom-tooltip" } );
	
});
