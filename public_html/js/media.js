angular.module('FlightClub').controller('MediaCtrl', function ($scope) {

    $scope.$emit('viewBroadcast', 'media');

    $scope.$parent.toolbarTitle = 'Flight Club | Media';
    
    $scope.mediaTiles = (function() {
    var tiles = [];
        tiles.push(
            {name: 'TMRO Interview', url: '//www.tmro.tv/2016/10/16/beautiful-data-rocket-launches/', thumbnail: '/images/media/tmro_interview.png' },
            {name: 'The Economist', url: '//www.economist.com/technology-quarterly/2016-25-08/space-2016', thumbnail: '/images/media/the_economist.png' },
            {name: 'Twitter Mentions', url: '//twitter.com/search?vertical=default&q=flightclub.io%20OR%20%23flightclubio&src=typd', thumbnail: '/images/media/twitter_mentions.png' },
            {name: 'SpaceX CRS-9', url: '//www.youtube.com/watch?v=NT50R2dLht8', thumbnail: '/images/media/spacex_crs-9.png' },
            {name: 'Cesium Showcase', url: '//cesiumjs.org/demos/FlightClub.html', thumbnail: '/images/media/cesium_showcase.png' },
            {name: 'SpaceX CRS-8', url: '//www.youtube.com/watch?v=ibv6vcNrxzA', thumbnail: '/images/media/spacex_crs-8.png' },
            {name: 'SpaceX JCSAT-14', url: '//www.youtube.com/watch?v=ui2H8aV99I4', thumbnail: '/images/media/spacex_jcsat-14.png' },
            {name: 'Orbital Mechanics Interview', url: '//theorbitalmechanics.com/show-notes/psas', thumbnail: '/images/media/orbital_mechanics_interview.png' },
            {name: 'SpaceX SES-9', url: '//www.youtube.com/watch?v=wkMZbL-CzB0', thumbnail: '/images/media/spacex_ses-9.png' },
            {name: 'SpaceX Jason-3', url: '//www.youtube.com/watch?v=bpVNV9FzHqI', thumbnail: '/images/media/spacex_jason-3.png' },
            {name: 'SpaceX Orbcomm OG2', url: '//www.youtube.com/watch?v=RKJBV5vcel8', thumbnail: '/images/media/spacex_orbcomm_og2.png' }, //img.youtube.com/vi/RKJBV5vcel8/mqdefault.png
            {name: 'Popular Mechanics Article', url: '//www.popularmechanics.com/space/rockets/a18289/choose-your-own-spacex-adventure-with-this-website/', thumbnail: '/images/media/popular_mechanics_article.png' }
        );
        return tiles;
    })();

});