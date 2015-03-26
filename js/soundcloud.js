jQuery(document).ready(function () {

	// initialize the soundcloud api
	SC.initialize({	
		client_id: "[CLIENT_ID]",
		redirect_uri: "http://tonefolder.com/playing-faves/callback.html"
	});
	
	var track, //the current track loaded into the player
		trackUrl, //the current track's stream url
		loggedIn, //current user
		replacementImg = "images/sc_transparent.png", //image placeholder for tracks w/o artwork
		thumbnail,
		listSize = 30, //num of tracks per initial user favorite list
		userSize = 50, //number of follower/following users per initial page load
		offset;
	
	//create methods for the info bar
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
						userUrl: data.permalink_url,
						favorites: data.public_favorites_count,
						avatar: data.avatar_url
					
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

					var noDescription = data.description == "";

					var details = function() {

						if (noDescription) {

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
	
	//create methods for SC player
	var Player = {
		
		init: function(user) {
			
			var url = "/users/" + user + "/favorites/";
			
			SC.get(url, {limit:1}, function(data) {
				
				jQuery.map(data, function(track) {
					
					trackUrl = "/tracks/" + track.id;

					Info.current.init({
					
						url: trackUrl,
						template: jQuery("#info-template").html(),
						container: jQuery("#current_track")
						
					});
					
					var widgetIframe = document.getElementById("sc-widget"),
						widget = SC.Widget(widgetIframe),
						widgetUrl = "http://w.soundcloud.com/player/?url=" + trackUrl;
						
						widget.load(widgetUrl, {
						
							show_artwork: false,
							buying: false,
							liking: false,
							download: false
							
						});
					
					Player.artwork.init({
			
						url: trackUrl,
						template: jQuery("#artwork-template").html(),
						container: jQuery("#artwork")
						
					});
				
				});
				
			});

		},
		
		embed: function(jQuerytrack) {
			
			var widgetIframe = document.getElementById("sc-widget"),
				widget = SC.Widget(widgetIframe),
				widgetId = jQuerytrack[0].id,
				trackUrl = "/tracks/" + widgetId;
				widgetUrl = "http://w.soundcloud.com/player/?url=" + trackUrl,
				nextWidgetId = jQuerytrack.next().id,
				nextWidgetUrl = "http://w.soundcloud.com/player/?url=/tracks/" + nextWidgetId;
				
				 //widget.bind(SC.Widget.Events.FINISH, function() {
				 
					 widget.load(widgetUrl, {
					
						show_artwork: false,
						auto_play: true,
						buying: false,
						liking: false,
						download: false
						
					});
					
				//});
			
			jQuery("#artwork img").remove();
			
			this.artwork.init({
			
				url: trackUrl,
				template: jQuery("#artwork-template").html(),
				container: jQuery("#artwork")
				
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
			
			fullsize: function(imageSrc) {
				
				imgExists = imageSrc != "";

				if (imgExists) {
					
					var art = imageSrc.replace("large","original");

					jQuery("#content img").attr("src", art);
					jQuery("#lightbox").fadeIn(500);

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
			
			SC.get("/users/" + this.user + "/followings", {limit: userSize}, function( data ) {
			
				self.items = jQuery.map( data, function( user ) {
					
					var hasFavorites = user.public_favorites_count > 0;
					
					if ( hasFavorites ) {
						
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
			
			SC.get("/users/" + this.user + "/followers", {limit: userSize, offset: offset}, function( data ) {
			
				self.items = jQuery.map( data, function( user ) {
					
					var hasFavorites = user.public_favorites_count > 0;
					
					if ( hasFavorites ) {
						
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
			
			SC.get("/users/" + this.user + "/followers", {limit: userSize}, function( data ) {
			
				self.items = jQuery.map( data, function( user ) {
					
					var hasFavorites = user.public_favorites_count > 0;
					
					if ( hasFavorites ) {
					
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
			
			jQuery("#landing").fadeOut("slow", "linear", function() {
			
				jQuery("#soundcloud").fadeIn("slow", "linear");
				jQuery("footer").show();
			
			});
		
		},
		
		page: function(offset) {

			var self = this;
			
			SC.get("/users/" + this.user + "/followers", {limit: userSize, offset: offset}, function( data ) {
			
				self.items = jQuery.map( data, function( user ) {
					
					var hasFavorites = user.public_favorites_count > 0;
					
					if ( hasFavorites ) {
						
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

			jQuery("#list a").remove();
			
			this.fetch();
		},
		attachTemplate: function() {
			var template = Handlebars.compile( this.template );
			this.container.append( template( this.items ) );
		},
		fetch: function() {
			
			var self = this;
			
			SC.get( this.url, {limit: listSize}, function( data ) {
											
				self.items = jQuery.map( data, function( tracks ) {

					var datestr = tracks.created_at,
					date = datestr.substring(0,10),
					img_exists = tracks.artwork_url != null;
					
					var thumbnail = function() {
						
						if (img_exists) {
							
							return tracks.artwork_url;
							
						} else {
							
							return replacementImg;
						
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
			
			SC.get( this.url, {limit: listSize, offset: offset }, function( data ) {
											
				self.items = jQuery.map( data, function( tracks ) {

					var datestr = tracks.created_at,
					date = datestr.substring(0,10),
					img_exists = tracks.artwork_url != null;
					
					var thumbnail = function() {
						
						if (img_exists) {
							
							return tracks.artwork_url;
							
						} else {
							
							return replacementImg;
						
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
	
	//connect with soundcloud
	jQuery(".connect").click(function() {
		
		SC.connect(function() {
			
			SC.get("/me", function(user) { 

				loggedIn = user.id;

				Info.init({
					
					userid: loggedIn,
					template: jQuery("#user-template").html(),
					container: jQuery("#userinfo")
					
				});

				Player.init(loggedIn);

				//initialize the tracklist
				List.init({
				
					url: "/users/" + loggedIn + "/favorites",
					template: jQuery("#list-template").html(),
					container: jQuery("#list")
					
				});

				Following.init({
				
					user: loggedIn,
					template: jQuery("#following-template").html(),
					container: jQuery("#following")
					
				});

				Followers.init({
				
					user: loggedIn,
					template: jQuery("#followers-template").html(),
					container: jQuery("#followers")
					
				});


			});
		
		});
		
	});
	
	jQuery("#list").on("click", "a", function() {
		
		jQuery("#current_track span").remove();

		var jQuerytrack = jQuery(this),
			trackUrl = "/tracks/" + this.id;
		
		Player.embed(jQuerytrack);
		
		Info.current.init({
		
			url: trackUrl,
			template: jQuery("#info-template").html(),
			container: jQuery("#current_track")
			
		});

	});		
	
	
	jQuery(".userlist").on("click", "a", function() {
		
		jQuery("#userinfo span").remove();
		
		var userid = this.id;
		
		Info.init({
					
			userid: userid,
			template: jQuery("#user-template").html(),
			container: jQuery("#userinfo")
					
		});
		
		//initialize the tracklist
		List.init({
			url: "/users/" + userid + "/favorites",
			template: jQuery("#list-template").html(),
			container: jQuery("#list")
		});
		
		jQuery("html, body").animate({scrollTop:0}, "slow");
		
	});

	jQuery(".pagination").on("click", "a#list_page", function() {
		
		var size = jQuery("#list a").length;
		
		offset = size;
		
		List.page(offset);

	});
	
	jQuery(".pagination").on("click", "a#user_page", function() {
		
		var size = jQuery("#users a").length;
		
		offset = size;
		
		Following.page(offset);
		Followers.page(offset);

	});
	
	jQuery("#artwork").on("click", "img", function() {
	
		var imageSrc = jQuery(this).attr("src");
		
		Player.artwork.fullsize(imageSrc);
	
	});

	jQuery("#list, #users, #info").tooltip( { tooltipClass: "custom-tooltip" } );
	
	jQuery("#lightbox").draggable()
			
		.on("click", ".close", function() { 
				
			jQuery(this).parent().fadeOut(500);
					
		});
	
	jQuery("#info, #list, #users").click(function(){ jQuery("#lightbox").fadeOut(500); });
	
});
