#!/bin/bash

LOCAL=/var/www/html
REMOTE=/var/www/html/flightclub

usage() { echo "Usage: $0 [--all] [--lite] [--index] [--js] [--css] [--pages] [--images] " 1>&2; exit 1; }

# set options
OPTS=`getopt -o h -l index,js,images,pages,css,all,lite -- "$@"`
eval set -- "$OPTS"

# build list
LIST=''
while true ; do
    case "$1" in
	--all)		LIST="$LOCAL/index.html $LOCAL/js/ $LOCAL/css/ $LOCAL/pages/ $LOCAL/images/"; break;;
	--lite)		LIST="$LOCAL/index.html $LOCAL/js/ $LOCAL/css/ $LOCAL/pages/"; break;;
	--index) 	LIST="$LIST $LOCAL/index.html"; shift;;
        --js)		LIST="$LIST $LOCAL/js/"; shift;;
        --images)	LIST="$LIST $LOCAL/images/"; shift;;
        --pages)	LIST="$LIST $LOCAL/pages/"; shift;;
        --css)		LIST="$LIST $LOCAL/css/"; shift;;
	--) 		shift; break;;
    esac
done

# do deploy
if [[ ! -z $LIST ]]; then

	#echo 'LIST = '
	#echo $LIST

	echo "Have you gulp'd???"

	echo '############# copying...'
	scp -r $LIST root@178.62.67.169:$REMOTE
	echo '############# restarting...'
	ssh root@178.62.67.169 "service apache2 restart"
	echo '############# done.'
else
	usage
fi
