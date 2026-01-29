#!/bin/bash

########### ONLY EVER HAVE TO CHANGE THESE #######
databaseName="Keyled_Statistics"
homeDir="/home/pi/webpageHosting/database-backups"
##################################################

# month-day-year-hour-minute-seconds
timestamp=$(date +%B-%d-%Y-%H-%M-%S)

s3BucketName="provisioning-and-flashing-tracker-backup"

awsLocation=$(which aws)
mysqldumpLocation=$(which mysqldump)

backupFilesLocation="${homeDir}/backups"
backupLogsLocation="${homeDir}/logs"

backupFile="${backupFilesLocation}/${timestamp}.sql"
logFile="${backupLogsLocation}/${timestamp}_backup.log"

fileLimit=1000

# ensure that the directories exist
mkdir -p "${homeDir}" "${backupFilesLocation}" "${backupLogsLocation}"

{
    echo "===================================="
    echo "Backup started: $(date)"
    echo

    # create a backup of the sql database (creds in ~/.my.cnf)
    "${mysqldumpLocation}" "${databaseName}" > "${backupFile}"

    if [ $? -eq 0 ]; then
        echo "Backup successful: ${backupFile}"

        # limit to fileLimit backups
        fileCount="$(ls -1 ${backupFilesLocation} | wc -l)"
        if [ "${fileCount}" -gt "${fileLimit}" ]; then
            oldestFile=$(ls -tr "${backupFilesLocation}" | head -n 1)

            echo
            echo "More than ${fileLimit} backups detected; deleting oldest backup: ${oldestFile}"
            echo

            rm "${backupFilesLocation}/${oldestFile}"
        fi

        # sync the backup directory to the s3 bucket
        echo "Syncing to AWS S3 bucket: ${s3BucketName}"
        if [ "${fileCount}" -ge "${fileLimit}" ]; then
            "${awsLocation}" s3 sync "${backupFilesLocation}" "s3://${s3BucketName}"
        else
            "${awsLocation}" s3 sync "${backupFilesLocation}" "s3://${s3BucketName}" --delete
        fi

    else
        rm ${backupFile}
        echo "Backup failed"
    fi

    echo
    echo "Backup finished: $(date)"
    echo "===================================="

} >> "${logFile}" 2>&1