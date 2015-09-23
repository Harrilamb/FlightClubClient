<?php

$id = '';
if(isset($_GET["id"])) {
  $id = $_GET["id"];
}
$payload = '';
if(isset($_GET["pl"])) {
  $payload = $_GET["pl"];
}

?>

<!doctype html>
<html>
  <head>
    <title>Jason-3 Results</title>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <script src='http://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js'></script>
    <!-- Latest compiled and minified CSS -->
    <link rel='stylesheet' href='https://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css'>
    <!-- Optional theme -->
    <link rel='stylesheet' href='https://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap-theme.min.css'>
    <!-- Latest compiled and minified JavaScript -->
    <script src='https://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/js/bootstrap.min.js'></script>
    <link href='https://fonts.googleapis.com/css?family=Quicksand' rel='stylesheet' type='text/css'>
    
    <script src='https://javascriptbase64.googlecode.com/files/base64.js' type='text/javascript'></script>
    <script src="js/ajax_testing.js"></script>    
    
    <link rel='stylesheet' href='css/style.css' />
    <link rel='stylesheet' href='css/mobile-style.css' />
    <link rel='stylesheet' href='css/large-style.css' />
    <link rel='shortcut icon' href='images/favicon.ico' type='image/x-icon'>
  </head>
  <body id="results" onLoad="loadImages()">
    <div class='bg'>
      <img src='images/background.jpg' alt='background' />
    </div>
    <div class='container'>
      <nav class='navbar navbar-default'>
        <!-- Brand and toggle get grouped for better mobile display -->
        <div class='navbar-header'>
          <a class='navbar-brand left' href='/'><span class='glyphicon glyphicon-home'></span>  Home</a>
          <?php
            if($id!=='' && $payload!=='') {
              echo '<a class="navbar-brand left" href="/FlightClub/LiveLaunch?id='.$id.'&pl='.$payload.'><span class="glyphicon glyphicon-eye-open"></span>  Watch Live!</a>'."\n";
            }
          ?>
        </div>
        <span class='navbar-brand right'>Jason-3 Results</span>
      </nav>
      <div class="resultGrid">
      </div>
    </div>
  </body>
</html>
