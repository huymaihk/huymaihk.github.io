<?php
$servername = "sql12.freesqldatabase.com";
$username = "sql12724954";
$password = "GvuHn5wvBd";
$dbname = "sql12724954";
$port = 3306;
$conn = new mysqli($servername, $username, $password, $dbname, $port);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$sql = "SELECT id, Pressure, RPM1, RPM2, Frequency1, Frequency2, data_setpoint, date_Pressure, time_Pressure FROM Pressure_data";
$result = $conn->query($sql);

$data = array();
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
}

$conn->close();

header('Content-Type: application/json');
echo json_encode($data);
?>