(function($) {
    //available externally
    window.Album = Backbone.Model.extend({
        isFirstTrack: function(index){
            return index == 0;
        },
        isLastTrack: function(index){
            return index >= this.get('tracks').length - 1;
        },
        trackUrlAtIndex: function(index){
            if(index <= this.get('tracks').length){
                return this.get('tracks')[index].url;
            }
            return null;
        }
    });

    window.Albums = Backbone.Collection.extend({
        model: Album,
        url: '/albums'
    });

    window.Playlist = Albums.extend({
        isFirstAlbum: function(index){
            return (index == 0);
        },
        isLastAlbum: function(index){
            return (index == (this.models.length - 1))
        }
    });

    window.Player = Backbone.Model.extend({
        defaults: {
            'currentAlbumIndex': 0,
            'currentTrackIndex': 0,
            'state': 'stop'
        },
        initialize: function(){
            this.playlist = new Playlist();
        },
        play: function(){
            this.set({'state': 'play'});
        },
        pause: function(){
            this.set({'state': 'pause'});
        },
        isPlaying: function(){
            return (this.get('state') == 'play');
        },
        isStopped: function(){
            return (!this.isPlaying());
        },
        currentAlbum: function(){
            return this.playlist.at(this.get('currentAlbumIndex'));
        },
        //TODO: 54:15
        currentTrackUrl: function(){
            var album = this.currentAlbum();
            return album.trackUrlAtIndex(this.get('currentTrackIndex'));
        },
        nextTrack: function() {
            var currentTrackIndex = this.get('currentTrackIndex'),
                currentAlbumIndex = this.get('currentAlbumIndex');
            if (this.currentAlbum().isLastTrack(currentTrackIndex)) {
                if (this.playlist.isLastAlbum(currentAlbumIndex)) {
                    this.set({'currentAlbumIndex': 0});
                    this.set({'currentTrackIndex': 0});
                } else {
                    this.set({'currentAlbumIndex': currentAlbumIndex + 1});
                    this.set({'currentTrackIndex': 0});
                }
            } else {
                this.set({'currentTrackIndex': currentTrackIndex + 1});
            }
            this.logCurrentAlbumAndTrack();
        },

        prevTrack: function() {
            var currentTrackIndex = this.get('currentTrackIndex'),
                currentAlbumIndex = this.get('currentAlbumIndex'),
                lastModelIndex = 0;
            if (this.currentAlbum().isFirstTrack(currentTrackIndex)) {
                if (this.playlist.isFirstAlbum(currentAlbumIndex)) {
                    lastModelIndex = this.playlist.models.length - 1;
                    this.set({'currentAlbumIndex': lastModelIndex});
                } else {
                    this.set({'currentAlbumIndex': currentAlbumIndex - 1});
                }
                // In either case, go to last track on album
                var lastTrackIndex =
                    this.currentAlbum().get('tracks').length - 1;
                this.set({'currentTrackIndex': lastTrackIndex});
            } else {
                this.set({'currentTrackIndex': currentTrackIndex - 1});
            }
            this.logCurrentAlbumAndTrack();
        },

        logCurrentAlbumAndTrack: function() {
            console.log("Player " +
                this.get('currentAlbumIndex') + ':' +
                this.get('currentTrackIndex'), this);
        }

    });

    window.library = new Albums();
    window.player = new Player();
//$(document).ready
    //how to display single album
    window.AlbumView = Backbone.View.extend({
        //shared by any sub classes
//        template: _.template($('#album-template').html()),
        template: "#album-template",
        tag: 'li',
        className: 'album',

        initialize: function(){
            _.bindAll(this, 'render'); //Permanently assoc method with a specific object
            //this.model.bind('change', this.render);
//            this.template = _.template($('#album-template').html()); //In index.html, script tag
            this.initializeTemplate();
        },

        initializeTemplate: function() {
            this.template = _.template($(this.template).html());
        },

        render: function(){
            var renderedContent = this.template(this.model.toJSON());
            $(this.el).html(renderedContent);   //el is view object
            return this;
        }
    });

    window.LibraryAlbumView = AlbumView.extend({
        events:{
            'click .queue.add': 'select'
        },

        select: function(){
            this.collection.trigger('select', this.model);
//            console.log("Triggered select", this.model);
        }
    });

    window.PlaylistAlbumView = AlbumView.extend({
        events: {
            'click .queue.remove': 'removeFromPlaylist'
        },
        initialize: function(){
            _.bindAll(this, 'render',
                            'updateState',
                            'updateTrack',
                            'remove');
            this.initializeTemplate();

            this.player = this.options.player;
            this.player.bind('change:state', this.updateState);
            this.player.bind('change:currentTrackIndex', this.updateTrack);

            this.model.bind('remove', this.remove);
        },

        render: function() {
            $(this.el).html(this.template(this.model.toJSON()));
            this.updateTrack();
            return this;
        },

        updateState: function() {
            var isAlbumCurrent = (this.player.currentAlbum() === this.model);
            $(this.el).toggleClass('current', isAlbumCurrent);
        },

        updateTrack: function() {
            var isAlbumCurrent = (this.player.currentAlbum() === this.model);
            if (isAlbumCurrent) {
                var currentTrackIndex = this.player.get('currentTrackIndex');
                this.$("li").each(function(index, el) {
                    $(el).toggleClass('current', index == currentTrackIndex);
                });
            }
            this.updateState();
        },
        removeFromPlaylist: function(){
            this.options.playlist.remove(this.model);
//            this.player.reset();

        }
    });

    window.PlaylistView = Backbone.View.extend({
        tag: 'section',
        className: 'playlist',

        events: {
            'click .play':  'play',
            'click .pause': 'pause',
            'click .next':  'nextTrack',
            'click .prev':  'prevTrack'
        },

        initialize: function(){
            _.bindAll(this, 'render',
                            'renderAlbum',
                            'updateTrack',
                            'queueAlbum');
            this.template = _.template($('#playlist-template').html());
            this.collection.bind('reset', this.render);
            this.collection.bind('add', this.renderAlbum);

            this.player = this.options.player;
            this.player.bind('change:currentTrackIndex', this.updateTrack);
            this.createAudio();

            this.library = this.options.library;
            this.library.bind('select', this.queueAlbum);
        },

        createAudio: function() {
            this.audio = new Audio();
        },

        render: function(){
            $(this.el).html(this.template(this.player.toJSON()));
            this.collection.each(this.renderAlbum);

            this.$('button.play').toggle(this.player.isStopped());
            this.$('button.pause').toggle(this.player.isPlaying());
            return this;
        },

        renderAlbum: function(album){
            var view = new PlaylistAlbumView({
                model: album,
                player: this.player,
                playlist: this.collection
            });
            this.$('ul').append(view.render().el);
        },

        updateTrack: function() {
            this.audio.src = this.player.currentTrackUrl();
            if (this.player.get('state') == 'play') {
                this.audio.play();
            }
        },
//TODO: 52:30 has some conflicts with here
//      53:41
        queueAlbum: function(album){
            this.collection.add(album);
        },

        play: function() {
            this.player.play();
            this.audio.play();
            this.$("button.play").hide();
            this.$("button.pause").show();
        },

        pause: function() {
            this.player.pause();
            this.audio.pause();
            this.$("button.pause").hide();
            this.$("button.play").show();
        },

        nextTrack: function() {
            this.player.nextTrack();
        },

        prevTrack: function() {
            this.player.prevTrack();
        }
    });

    window.LibraryView = Backbone.View.extend({
        tag: 'section',
//        tagName: 'section',
        className: 'library',

        initialize: function(){
            _.bindAll(this, 'render');
            this.template = _.template($('#library-template').html());
//            this.collection.bind('reset', this.render); //reset is a method for collection, it avoid manully load data, clear duplicated data
            this.collection.bind('refresh', this.render);
        },

        render: function(){
            var $albums;
            var collection = this.collection;

            $(this.el).html(this.template({}));     //skip template engine, use pure html

            $albums = this.$(".albums");            //search current object instead of global search
            collection.each(function(album){
                var view = new LibraryAlbumView({
                    model: album,
                    collection: collection
                });
                $albums.append(view.render().el);
            });
            return this;
        }
    });

    window.BackboneTunes = Backbone.Router.extend({
        routes: {
            '': 'home',
            'blank': 'blank'
        },
        initialize: function(){
            this.playlistView = new PlaylistView({
                collection: window.player.playlist,
                player:     window.player,
                library:    window.library
            });
            this.libraryView = new LibraryView({
                collection: window.library
            });
        },
        home: function(){
            var $container = $('#container');
            $container.empty();
            $container.append(this.playlistView.render().el);
            $container.append(this.libraryView.render().el);
        },
        blank: function(){
            $('#container').empty();
            $('#container').text('blank');
        }
    });

    $(function(){
        window.App = new BackboneTunes();
        Backbone.history.start({pushState: true});
    });
    /*
    * album=new Album({title:'abbey road',artist:'the beatles', tracks:[{title:'Track A'}]})
    * albumView = new AlbumView({model:album})
    * $('#container').append(albumView.render().el)
    * album.set({title:'2 people'})
    * album.set({tracks:[{title:'black hole'}]})
    *
    * albums.fetch()
    *
    * //test case 2:
    * albums = new Albums()
    * albums.fetch()
    * albums.models
    *
    * //play with functions:
    * albums.map(function(album){ return album.get('title')})
    * albums.pluck('title')
    *
    * //test 3
    * library = new Albums()
    * libraryView = new LibraryAlbumView({ collection: library })
    * $('#container').append(libraryView.render().el)
    * library.fetch()
    *
    * //text 4
    * App.navigate('',true)
    * App.navigate('blank',true)
    * * */
})(jQuery);
