$(document).ready(function () {

	// initialize the soundcloud api
	SC.initialize({	
		client_id: "2170b66abbf8f1381aedd4111f5c5a12",
		redirect_uri: "http://tonefolder.com/playing-faves/callback.html"
	});
	
	var track, //the current track loaded into the player
		track_url, //the current track's stream_url
		logged_in, //current user
		replacement_img = "images/sc_transparent.png", //image placeholder for tracks w/o artwork
		thumbnail,
		list_size = 30, //num of tracks per initial user favorite list
		user_size = 50, //number of follower/following users per initial page load
		offset;
	
	var Info = {
	
		init: function ( config ) {
		
			this.userid = config.userid;
			this.template = config.template;
			this.container = config.container;
			
			this.user();

		},
		
		attachTemplate: function() {
		
			var template = Handlebars.compile( this.template );
			this.container.append( template( this.info ) );
			
		},
		
		user: function() {
			
			var self = this;

			var url = "/users/" + this.userid;
			
			SC.get (url, function(data) {
			
				self.info =  {
					
						username: data.username,
						user_url: data.permalink_url
					
				};
				
				self.attachTemplate();
			
			});

		},
		
		current: {
		
			init: function( config ) {
			
				this.url = config.url;
				this.template = config.template;
				this.container = config.container;
				
				this.info();
				
			},
		
			attachTemplate: function() {
		
				var template = Handlebars.compile( this.template );
				this.container.append( template( this.trackinfo ) );
			
			},
			
			info: function() {
				
				var self = this;
			
				SC.get (this.url, function(data) {

					var no_description = data.description == "";

					var details = function() {

						if (no_description) {

							return "No description.";

						} else {

							return data.description;

						}

					};

					self.trackinfo =  {
					
						trackname: data.title,
						infouserurl: data.user.permalink_url,
						infouser: data.user.username,
						description: details()
					
					};
					
					self.attachTemplate();
				
				});
			
			}
			
		}
	
	};
	
	//create methods for streaming activity
	var Player = {
		
		init: function(user) {
			
			var url = "/users/" + user + "/favorites/";
			
			SC.get(url, {limit:1}, function(data) {
				
				$.map(data, function(track) {
					
					track_url = "/tracks/" + track.id;

					Info.current.init({
					
						url: track_url,
						template: $("#info-template").html(),
						container: $("#current_track")
						
					});
					
					var widgetIframe = document.getElementById("sc-widget"),
						widget = SC.Widget(widgetIframe),
						widgetUrl = "http://w.soundcloud.com/player/?url=" + track_url;
						
						widget.load(widgetUrl, {
						
							show_artwork: false,
							buying: false,
							liking: false,
							download: false
							
						});
					
					Player.artwork.init({
			
						url: track_url,
						template: $("#artwork-template").html(),
						container: $("#artwork")
						
					});
				
				});
				
			});

		},
		
		embed: function($track) {
			
			var widgetIframe = document.getElementById("sc-widget"),
				widget = SC.Widget(widgetIframe),
				newWidgetId = $track[0].id,
				track_url = "/tracks/" + newWidgetId;
				newWidgetUrl = "http://w.soundcloud.com/player/?url=" + track_url,
				nextWidgetId = $track.next().id,
				nextWidgetUrl = "http://w.soundcloud.com/player/?url=/tracks/" + nextWidgetId;
				
				 //widget.bind(SC.Widget.Events.FINISH, function() {
				 
					 widget.load(newWidgetUrl, {
					
						show_artwork: false,
						auto_play: true,
						buying: false,
						liking: false,
						download: false
						
					});
					
				//});
			
			$("#artwork img").remove();
			
			this.artwork.init({
			
				url: track_url,
				template: $("#artwork-template").html(),
				container: $("#artwork")
				
			});
			
		},
		
		artwork: {
		
			init: function ( config ) {
				
				this.url = config.url;
				this.template = config.template;
				this.container = config.container;
				
				this.thumb();
			
			},
			
			attachTemplate: function() {
		
			var template = Handlebars.compile( this.template );
			this.container.append( template( this.image ) );
			
			},
		
			thumb: function() {
				
				var self = this;
				
				SC.get(this.url, function(data) {
					
					self.image =  {
					
						thumbnail: data.artwork_url
					
					};
					
					self.attachTemplate();
				
				});
			
			},
			
			fullsize: function(image_src) {
				
				imgExists = image_src != "";

				if (imgExists) {
					
					var art = image_src.replace("large","original");

					$("#content img").attr("src", art);
					$("#lightbox").fadeIn(500);

				} else {

					return false;

				}
			
			}
		
		}
		
	};
	
	var Following = {
	
		init: function ( config ) {
		
			this.user = config.user;
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
			
			SC.get("/users/" + this.user + "/followings", {limit: user_size}, function( data ) {
			
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
			
			SC.get("/users/" + this.user + "/followers", {limit: user_size, offset: offset}, function( data ) {
			
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
		
			this.user = config.user;
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
			
			SC.get("/users/" + this.user + "/followers", {limit: user_size}, function( data ) {
			
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
			
			$("#landing").hide("slow", "linear", function() {
			
				$("#soundcloud").fadeIn("slow", "linear");
				$("footer").show();
			
			});
		
		},
		
		page: function(offset) {

			var self = this;
			
			SC.get("/users/" + this.user + "/followers", {limit: user_size, offset: offset}, function( data ) {
			
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
					
					var embeddable = tracks.embeddable_by == "all";

					if (embeddable) {
					
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
					
					}
					
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

	$(".connect").click(function() {
		
		SC.connect(function() {
			
			SC.get("/me", function(user) { 

				var logged_in = user.id;

				Info.init({
					
					userid: logged_in,
					template: $("#user-template").html(),
					container: $("#userinfo")
					
				});

				Player.init(logged_in);

				//initialize the tracklist
				List.init({
				
					url: "/users/" + logged_in + "/favorites",
					template: $("#list-template").html(),
					container: $("#list")
					
				});

				Following.init({
				
					user: logged_in,
					template: $("#following-template").html(),
					container: $("#following")
					
				});

				Followers.init({
				
					user: logged_in,
					template: $("#followers-template").html(),
					container: $("#followers")
					
				});


			});
		
		});
		
	});
	
	$("#list").on("click", "a", function() {
		
		$("#current_track span").remove();

		var $track = $(this),
			track_url = "/tracks/" + this.id;
		
		Player.embed($track);
		
		Info.current.init({
		
			url: track_url,
			template: $("#info-template").html(),
			container: $("#current_track")
			
		});

	});		
	
	
	$(".userlist").on("click", "a", function() {
		
		$("#userinfo span").remove();
		
		var userid = this.id;
		
		Info.init({
					
			userid: userid,
			template: $("#user-template").html(),
			container: $("#userinfo")
					
		});
		
		//initialize the tracklist
		List.init({
			url: "/users/" + userid + "/favorites",
			template: $("#list-template").html(),
			container: $("#list")
		});
		
		$("html, body").animate({scrollTop:0}, "slow");
		
	});

	$(".pagination").on("click", "a#list_page", function() {
		
		var size = $("#list a").length;
		
		offset = size;
		
		List.page(offset);

	});
	
	$(".pagination").on("click", "a#user_page", function() {
		
		var size = $("#users a").length;
		
		offset = size;
		
		Following.page(offset);
		Followers.page(offset);

	});
	
	$("#artwork").on("click", "img", function() {
	
		var image_src = $(this).attr("src");
		
		Player.artwork.fullsize(image_src);
	
	});

	$("#list, #users, #info").tooltip( { tooltipClass: "custom-tooltip" } );
	
	$("#lightbox").draggable()
			
		.on("click", ".close", function() { 
				
			$(this).parent().fadeOut(500);
					
		});
	
	$("#info, #list, #users").click(function(){ $("#lightbox").fadeOut(500); });
	
});
