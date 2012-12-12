$(document).ready(function () {

	// initialize the soundcloud api
	SC.initialize({	
		client_id: "2170b66abbf8f1381aedd4111f5c5a12",
		redirect_uri: "http://tonefolder.com/callback.html"
	});
	
	var track, //the current track loaded into the player
		latest, //the latest track
		trackurl, //the current track's stream_url
		user = "mporecchia", //current user
		replacement_img = "images/sc_transparent.png", //image placeholder for tracks w/o artwork
		list_size = 30, //num of tracks per initial user favorite list
		user_size = 50, //number of follower/following users per initial page load
		offset;
		
	//create methods for streaming activity
	var Stream = {
		
		init: function ( config ) {
			
			this.url = config.url;
			this.template = config.template;
			this.container = config.container;
			
			this.start();
			this.load();

		},
		
		attachTemplate: function() {
			
			var template = Handlebars.compile( this.template );			
			this.container.append( template( this.items ) );	
					
		},
		
		load: function() {
			
			var self = this;
			
			$(".gutter, .controls, .details").fadeOut("fast", function(){
				$(this).remove();
			});
			
			SC.get(self.url, function(json) {
				
				var trackArray = [json];
				self.items = $.map(trackArray, function( track ) {
					
					var datestr = track.created_at,
					date = datestr.substring(0,10);
					
					var duration = getDuration(track);
					
					var img	= track.artwork_url,
						img_exists = img != null;
					
					var thumbnail = function() {
						
						if (img_exists) {
						
							var art = img.replace("large","original");
							return art;
							
						} else {
							
							return replacement_img;
						
						}
		
					};
					
					var no_description = track.description == "";
					
					var details = function() {
						
						if (no_description) {
							
							return "None";
						
						} else {
						
							return track.description;
						
						}
					
					};

					return {
						title: track.title,
						artwork: thumbnail(),
						thumb: track.artwork_url,
						url: track.permalink_url,
						waveform: track.waveform_url,
						id: track.id,
						user: track.user.username,
						userlink: track.user.permalink_url,
						created: date,
						description: details(),
						duration: duration,
						genre: track.genre,
						tags: track.tag_list,
						license: track.license
					};
					
				});
				
				self.attachTemplate();
				
				Main.toolbar();
				Main.description();
				
				var options = {
					label: "pause",
					icons: {
						primary: "ui-icon-pause"
						}
				};

				$("#play").button("option", options);
							
			});
			
		},
		
		startLatest: function() {
						
			var loaded = $(".loaded").length > 0;
			
			if (loaded) {
				
				latest.play();
				
				$(".controls").removeClass("loaded");
				
				$("#list a:first").addClass("playing");
				
				$(".stopped").attr("class", "playing");
				
			} else {
				
				return false
			
			}	

		},
		
		start: function() {
			
			var self = this;
				
			SC.stream(this.url, function(sound) {
			
				track = sound;					
				sound.play();
				
			});
			
			$(".stopped").attr("class", "playing");	
			$(".controls").removeClass("ready");	
			
		},
		
		stop: function() {
			
			var sc_exists = typeof track != 'undefined',
				loaded = $(".loaded").length > 0,
				first = $(".playing, .paused, .stopped").index() == 1;

			if (loaded || first) {
			
				latest.stop();
				
				$(".playing, .paused").attr("class", "stopped");
				$(".controls").addClass("ready");
			
			} else if (sc_exists) {
				
				track.stop();
				
				$(".playing, .paused").attr("class", "stopped");
				$(".controls").addClass("ready");
				
			} else {
				
				return false;
							
			}
		},
		
		pause: function() {
			
			var loaded = $(".loaded").length > 0,
				first = $(".playing, .paused, .stopped").index() == 1;
			
			if (loaded || first) {
			
				latest.togglePause();
				
				$(".playing, .paused").toggleClass("playing").toggleClass("paused");
				
			} else {
				
				track.togglePause();
				
				$(".playing, .paused").toggleClass("playing").toggleClass("paused");
				
			}
		}
		
	};
	
	//create methods for populating the main div
	var Main = {
		
		init: function( config ) {
			
			this.url = config.url;
			this.template = config.template;
			this.container = config.container;
			
			$(".gutter, .controls, .details").remove();
			
			this.fetch();

		},
		
		attachTemplate: function() {
			var template = Handlebars.compile( this.template );
			this.container.append( template( this.items ) );
		},
		
		//transport controls via jQuery UI
		toolbar: function() {
			
			$("#prev").button({
				
				text: false,
				icons: {
					primary: "ui-icon-seek-start"
					}
			});
				
			$("#play").button({
				
				text: false,
				icons: {	
					primary: "ui-icon-play"
					}
					
			}).click(function() {
				
				var stopped = $(".playing, .paused").length == 0,
					loaded = $(".loaded").length > 0;
				
				if ( loaded ) {
				
					Stream.startLatest();

				} else if ( stopped ) {
				
					Stream.start();
				
				} else {
					
					Stream.pause();
					
				}
				
				var options;
					
				if ( $( this ).text() === "play" || loaded ) {
					options = {
						label: "pause",
						icons: {
							primary: "ui-icon-pause"
							}
					};
						
				} else {
					
					options = {
						label: "play",
						icons: {
							primary: "ui-icon-play"
							}
						};
						
					}
					
				$(this).button("option", options);
					
			});
				
			$("#stop").button({
				
				text: false,
				icons: {
					primary: "ui-icon-stop"
					}
					
				}).click(function() {
				
				Stream.stop();
					
				$("#play").button("option", {
					
					label: "play",
					icons: {
						primary: "ui-icon-play"
						}
						
				});
				
			});
							
			$("#rewind").button({
				
				text: false,				
				icons: {
					primary: "ui-icon-seek-prev"
					}
					
			});
						
			$("#fastfwd").button({
				
				text: false,
				icons: {
					primary: "ui-icon-seek-next"
					}
					
			});
					
			$("#next").button({
				
				text: false,				
				icons: {
					primary: "ui-icon-seek-end"
					}

			});
			
		},
					
		description: function(){
			
			$(".details").tooltip( { tooltipClass: "custom-tooltip" } );	
						
		},
					
		fetch: function() {
			
			var self = this;
			
			SC.get( this.url, {limit: 1}, function( data ) {
				
				self.items = $.map( data, function( track ) {
					
					trackurl = "/tracks/" + track.id;
					
					loadTrack();
					
					var datestr = track.created_at,
					date = datestr.substring(0,10);
					
					var duration = getDuration(track);
					
					var img	= track.artwork_url,
						img_exists = img != null;
					
					var thumbnail = function() {
						
						if (img_exists) {
							
							var art = img.replace("large","original");
							return art;
							
						} else {
							
							return replacement_img;
						
						}
		
					};
					
					var no_description = track.description == "";
					
					var details = function() {
						
						if (no_description) {
							
							return "None";
						
						} else {
						
							return track.description;
						
						}
					
					};

					return {
						title: track.title,
						artwork: thumbnail(),
						thumb: track.artwork_url,
						url: track.permalink_url,
						waveform: track.waveform_url,
						id: track.id,
						user: track.user.username,
						userlink: track.user.permalink_url,
						created: date,
						description: details(),
						duration: duration,
						genre: track.genre,
						tags: track.tag_list,
						license: track.license
					};
					
				});
				
				self.attachTemplate();
				self.toolbar();
				self.description();
				
				$(".controls").addClass("loaded");
				
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
	
	var User = {
	
		init: function( config ) {
		
			this.url = config.url;
			this.profile();

		},
	
		profile: function() {
			
			var self = this;
			
			SC.get (this.url, function( user ) {
				
				return {
				
					user: user.username,
					favorites: user.public_favorites_count,
					avatar: user.avatar_url,
					id: user.id
				
				};
			
			});
			
		}
		
	};
	
	//initialise the main div
	Main.init({
		url: "/users/" + user + "/favorites",
		template: $('#main-template').html(),
		container: $('#main')
	});
	
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
	
	//create a function to load the latest track via sm2
	function loadTrack() {
	
		SC.stream(trackurl, function(sound) {
			
			latest = sound;
			sound.load();

		});
	
	};
	
	//create a function to get track durations in minute/seconds format
	function getDuration(track) {

		var msec = track.duration,		
		fsec = msec / 1000,		
		mins = Math.floor(fsec/60),		
		dsec = (fsec % 60) + "",
		secs = dsec.substring(0,2),
		duration = (mins < 10 ? "0" : "" ) + mins + ":" + (secs < 10 ? "0" : "" ) + secs;
		
		return duration;
	};
	
	$("#list").on("click", "a", function() {
		
		if ( $(this).is(".playing, .paused") ) {
			
			Stream.pause();
			
		} else if ( $("#list a").not( $(this) ).is(".playing, .paused, .stopped") ) {
			
			Stream.stop();
			
			Stream.init({
				url: "/tracks/" + this.id,
				template: $('#main-template').html(),
				container: $('#main')
			});
			
			$(this).attr("class", "playing");
			
			$("#list a").not( $(this) ).removeAttr("class");

		} else {
			
			Stream.init({
				url: "/tracks/" + this.id,
				template: $('#main-template').html(),
				container: $('#main')
			});
			
			$(this).attr("class", "playing");
			$(".controls").removeClass("loaded");
			
		}
		
	});		
	
	$("#main").on("click", "#next", function() {
		
		var $nxt = $(".playing, .paused, .stopped").next(),
		id = $nxt.attr('id'), loaded = $(".loaded").length > 0,
		$second = $("#list a:first").next(), second_id = $second.attr("id"),
		lastid = $("#list a").last().attr("id"),
		playid = $(".playing, .paused, .stopped").attr("id");
		
		if (loaded) {

			Stream.init({
				url: "/tracks/" + second_id,
				template: $('#main-template').html(),
				container: $('#main')
			});
			
			$second.addClass("playing");

		} else if ( lastid == playid ) {
		
			return false
		
		} else {
			
			Stream.stop();
			
			Stream.init({
				url: "/tracks/" + id,
				template: $('#main-template').html(),
				container: $('#main')
			});
			
			$nxt.addClass("playing").prev().removeAttr("class");;
			
		}
		
	});
	
	$("#main").on("click", "#prev", function() {
		
		var $prev = $(".playing, .paused, .stopped").prev(),
		id = $prev.attr('id'), loaded = $(".loaded").length > 0,
		first = $(".playing, .paused, .stopped").index() == 1;

		if (loaded || first) {
			
			return false;
			
		} else {
			
			Stream.stop();
			
			Stream.init({
					url: "/tracks/" + id,
					template: $('#main-template').html(),
					container: $('#main')
				});
				
			$prev.addClass("playing").next().removeAttr("class");
		
		}
		
	});
	
	$('#username').submit(function(event){
	
		var userinput = $('#userinput').val();
		
		//initialise the main div
		Main.init({
			url: "/users/" + userinput + "/favorites",
			template: $('#main-template').html(),
			container: $('#main')
		});
		
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
			
		Stream.stop();
		
		//initialize the main div
		Main.init({
			url: "/users/" + user + "/favorites",
			template: $('#main-template').html(),
			container: $('#main')
		});
		
		//initialize the tracklist
		List.init({
			url: "/users/" + user + "/favorites",
			template: $('#list-template').html(),
			container: $('#list')
		});
		
		//grab user info for later
		User.init({
			url: "/users/" + user
		});
		
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
	
	$( "input:submit, #switch_user button" ).button();
	$("#list, #users").tooltip( { tooltipClass: "custom-tooltip" } );
	
});
