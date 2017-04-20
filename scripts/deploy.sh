#!/bin/bash

#LOCAL_DIR=/var/www/html
LOCAL_DIR=/Library/WebServer/Documents
REMOTE_DIR=/var/www/html/flightclub
SERVER=root@178.62.67.169

usage() { echo "Usage: $0 [--all] [--lite] [--index] [--js] [--css] [--pages] [--images] " 1>&2; exit 1; }

# set options
OPTS=`getopt -o h -l index,js,images,pages,css,all,lite -- "$@"`
eval set -- "$OPTS"

# build list
SCP_LIST=''
GULP_TARGETS=''
htmlpage=false;
while true ; do
    case "$1" in
	--all)		
		SCP_LIST="$LOCAL_DIR/index.html $LOCAL_DIR/js/ $LOCAL_DIR/css/ $LOCAL_DIR/pages/ $LOCAL_DIR/images/"
		break;;
	--lite)		
		SCP_LIST="$LOCAL_DIR/index.html $LOCAL_DIR/js/ $LOCAL_DIR/css/ $LOCAL_DIR/pages/"
		GULP_TARGETS="htmlpage scripts styles"
		break;;
	--index) 	
		SCP_LIST="$SCP_LIST $LOCAL_DIR/index.html"
		if ! $htmlpage; then 
			GULP_TARGETS="$GULP_TARGETS htmlpage"
			htmlpage=true
		fi
		shift;;
        --js)		
		SCP_LIST="$SCP_LIST $LOCAL_DIR/js/"
		GULP_TARGETS="$GULP_TARGETS scripts"
		shift;;
        --images)	
		SCP_LIST="$SCP_LIST $LOCAL_DIR/images/"
		GULP_TARGETS="$GULP_TARGETS imagemin"
		shift;;
        --pages)	
		SCP_LIST="$SCP_LIST $LOCAL_DIR/pages/"
		if ! $htmlpage; then 
			GULP_TARGETS="$GULP_TARGETS htmlpage"
			htmlpage=true
		fi
		shift;;
        --css)		
		SCP_LIST="$SCP_LIST $LOCAL_DIR/css/"
		GULP_TARGETS="$GULP_TARGETS styles"
		shift;;
	--) 		
		shift
		break;;
    esac
done

# do deploy
if [[ ! -z $SCP_LIST ]]; then

	#echo 'SCP_LIST = '
	#echo $SCP_LIST

	#echo 'GULP_TARGETS = '
	#echo $GULP_TARGETS

	echo '############# gulping...'
	gulp $GULP_TARGETS &
	sleep 2s
	echo '############# copying...'
	scp -r $SCP_LIST $SERVER:$REMOTE_DIR
	echo '############# restarting...'
	ssh $SERVER "service apache2 restart"
	echo '############# done.'
else
	usage
fi
