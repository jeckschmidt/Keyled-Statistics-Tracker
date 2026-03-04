import dotenv from 'dotenv/config'
import path from 'path'

const targetTableColumns = [
    "serial_number",
    "status",
    "bytes_written",
    "program_version",
    "target_RTC",
    "flash_date",
    "RTC_drift",
    "flash_provision",
    "hostname", 
    "reader_number",
    "logs"
]

export const app = {
    port: process.env.PORT,
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,

    targetTable: process.env.MYSQL_TABLE_TARGET,
    targetTableColumns: targetTableColumns,

    csvLocation: `${path.resolve()}/public`,
    statusColumnIndex: 5
}