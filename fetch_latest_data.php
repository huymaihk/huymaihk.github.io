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

// Truy vấn dữ liệu mới nhất
$sql = "SELECT Pressure, RPM1, RPM2, Frequency1, Frequency2 FROM Pressure_data ORDER BY id DESC LIMIT 1";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo json_encode($row);
} else {
    echo json_encode([]);
}

$conn->close();
?>
