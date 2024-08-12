<?php
$servername = "sql12.freesqldatabase.com";
$username = "sql12724954";
$password = "GvuHn5wvBd";
$dbname = "sql12724954";
$port = 3306;

// Tạo kết nối
$conn = new mysqli($servername, $username, $password, $dbname, $port);

// Kiểm tra kết nối
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
