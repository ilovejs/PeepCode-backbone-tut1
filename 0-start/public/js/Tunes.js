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

    window.library = new Albums();


    //how to display single album
    window.AlbumView = Backbone.View.extend({
        //tagName????
//        template: "#album-template",
        tagName: 'li',
        className: 'album',

        initialize: function(){
            _.bindAll(this, 'render'); //Permanently assoc method with a specific object
            this.model.bind('change', this.render);
            this.template = _.template($('#album-template').html()); //In index.html, script tag
        },

        render: function(){
            var renderedContent = this.template(this.model.toJSON());
            $(this.el).html(renderedContent);   //el is view object
            return this;
        }
    });

    window.LibraryAlbumView = AlbumView.extend({

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
            '': 'home'
        },
        initialize: function(){
            this.libraryView = new LibraryView({
                collection: window.library
            });
        },
        home: function(){
            var $container = $('#container');
            $container.empty();
            $container.append(this.libraryView.render().el);
        },
        blank: function(){
            $('#container').empty();
            $('#container').text('blank');
        }
    });

    $(function(){
        window.App = new BackboneTunes();
        Backbone.history.start();
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
