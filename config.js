import dotenv from 'dotenv/config'
import path from 'path'

const targetTableCols = {
    macAddress: "MAC_address",
    provisionStatus: "provision_status",
    rtcStatus: "RTC_status",
    programVersion: "program_version",
    date: "date",
    flashProvision: "flash_provision",
    hostname: "hostname",
    readerNumber: "reader_number",
    active: "is_active",
    logs: "logs"    
}

const secretTableColumns = [
    "hashed_secret",
    "user"
]

const usersTableColumns = [
    "username",
    "password_hash"
]

export const app = {
    port: process.env.PORT,
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,

    targetTable: process.env.MYSQL_TABLE_TARGET,
    targetTableCols: targetTableCols,

    secretsTable: process.env.MYSQL_TABLE_SECRETS,
    secretsTableColumns: secretTableColumns,

    usersTable: process.env.MYSQL_TABLE_USERS,
    usersTableColumns: usersTableColumns,

    csvLocation: `${path.resolve()}/public`,

    provisionStatusColIndex: 3,
    rtcStatusColIndex: 4,
    activeColIndex: 8,
    readerNumberColIndex: 2
}