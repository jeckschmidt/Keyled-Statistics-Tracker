DROP DATABASE IF EXISTS `Keyled_Statistics`;
CREATE DATABASE `Keyled_Statistics`;
USE `Keyled_Statistics`;

CREATE TABLE target_information (
    id INT AUTO_INCREMENT,
    serial_number VARCHAR (50),
    flash_status BOOL,
    bytes_written INT,
    program_version VARCHAR (50),
    target_RTC VARCHAR (50),
    flash_date VARCHAR (50),
    rtc_drift VARCHAR (50),
    PRIMARY KEY (id)
);
