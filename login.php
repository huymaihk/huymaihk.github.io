<?php
session_start();
require 'database.php'; // kết nối đến database

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = $_POST['username'];
    $password = $_POST['password'];

    // Kiểm tra thông tin đăng nhập
    $query = "SELECT * FROM register_an_account WHERE username = ? AND password = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('ss', $username, $password);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        // Đăng nhập thành công, cập nhật thông tin vào log_in_to_your_account
        $query = "INSERT INTO log_in_to_your_account (username, password, date_login, time_login) VALUES (?, ?, CURDATE(), CURTIME())";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('ss', $username, $password);
        $stmt->execute();

        // Chuyển hướng đến trang thông báo thành công
        header("Location: success.html");
        exit();
    } else {
        echo "Thông tin đăng nhập không chính xác!";
    }
}
?>
