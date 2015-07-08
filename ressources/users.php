<?php
	// écriture
	$myFile = "users.txt";
	$fh = fopen($myFile, 'w') or die("can't open file");
	$name = $name . "\n";
	fwrite($fh, $name);
	$id = $id . "\n\n";
	fwrite($fh, $id);
	fclose($fh);

	// lecture
	$fh = fopen($myFile, 'r');
	$data = fgets($fh);
	fclose($fh);
	echo $data;
?>