import os
import sys
import time
import random
import atexit
import threading
import subprocess
import shutil
from pathlib import Path
from importlib_metadata import distribution, metadata, version

# Used for Jack's website
from datetime import datetime
import requests
import json

from gpiozero import Button, PWMLED, OutputDevice # LED

# --------- GLOBAL VARIABLES -----------------
# --------------------------------------------

hostname = "https://waterless-jay-0522.dataplicity.io"
apiKey=''
pathToCache = '/home/pi/Jack/cache.txt'
pathToLogs = '/home/pi/Mpod/flash_provision_logs'

RED = "\033[31m"
GREEN = "\033[32m"
RESET = "\033[0m"
# --------------------------------------------


#3/6/2025  Add century.sh.  key_led.py working as a systemd service
#           Don't know if hwclock works as a foreground task (not as systemd service
# running "sh user_autostart.sh" in the foreground works. and get PRINT statements
# added sudo in front of hwclock since now fixed key_led.service User=pi statement
# bug:  running as systemd service missing many PRINT statements.

def timedInput(prompt, timeout=20):
    user_input = [None]

    def ask():
        user_input[0] = input(prompt)

    thread = threading.Thread(target=ask)
    thread.daemon = True
    thread.start()
    thread.join(timeout)

    if thread.is_alive():
        # Timeout happened
        return 'NULL'
    return user_input[0]

def safeRequest(method, url, timeout=5, **kwargs):
    try:
        return requests.request(method=method, url=url, timeout=timeout, **kwargs)
    except Exception as err:
        return None


class Prog( threading.Thread ):
    
    IO_PROG_RST_PIN = 4
    IO_PROG_BOOT_PIN = 17    # change from 17 to 8 12/29/2024 RC  AND BACK TO 17 2/1/25

    IO_LED_READY = 12
    IO_LED_OK = 25
    IO_LED_FAULT = 24
    
    IO_BTN = 26
    IO_BTN2 = 19
    
    def __init__(self):
        
        super().__init__()
        
        self.io_rst = OutputDevice(self.IO_PROG_RST_PIN)
        self.io_boot = OutputDevice(self.IO_PROG_BOOT_PIN)
        
        self.led_ready = PWMLED(self.IO_LED_READY)
        self.led_ok = PWMLED(self.IO_LED_OK)
        self.led_fault = PWMLED(self.IO_LED_FAULT)
        
        self.btn = Button(self.IO_BTN)
        self.btn2 = Button(self.IO_BTN2)
        
        atexit.register(self._exit)
        
        ####
        self.io_rst.off()   # init RST=LOW
        self.io_boot.off()  # init BOOT=LOW
        
        #### led show
        print('[KEYLED] Led show', flush=True)
        self.led_ok.pulse(1, 1)
        self.led_fault.pulse(1, 1)
        self.led_ready.pulse(0.2, 0.2, n=5, background=False)
        self.led_ok.off()   
        self.led_fault.off()
        #### led show
        
    def _exit(self):
        print('[KEYLED] Exiting...', end="", flush=True)
        self.io_rst.close()
        self.io_boot.close()
        self.led_fault.close()
        self.led_ok.close()
        self.led_ready.close()
        self.btn.close()
        self.btn2.close()
        print("Done", flush=True)


    def run(self):
        
        while True:
            print('[KEYLED] Ready to program...', flush=True)
            self.led_ready.blink(0.6, 0.6, 0.1, 0.1)
            
            #b = self.btn.wait_for_press() # block here
            
                        
            while True:
                self.b1 = self.btn.is_pressed
                self.b2 = self.btn2.is_pressed
                if self.b1 or self.b2:
                    break
                

            print('[KEYLED] Button pressed...', flush=True)
            #if not b:
            #	continue

            if True: # debounce if needed
                time.sleep(0.1)
                if not self.btn.is_pressed and not self.btn2.is_pressed :
                    continue
            
            self.do_prog()
            
            time.sleep(1)
            
    def do_prog(self):
        print('[KEYLED] Doing programming....', flush=True)
        self.led_ready.pulse(0.1, 0.125)
        self.led_ok.off() 
        self.led_fault.off()

        # ask for reader number
        readerNumber = timedInput("Enter Reader Number (20s timeout): ", 20)
        
        # modify the century bit #RC
        cmd = "sh century.sh"
        res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        print("setting century bit", res, flush=True)
        
        # Set the date and time from raspberry pi clock #RC
        cmd = "sudo hwclock -w"
        res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        print("hwclock -w", res, flush=True)
        
        # set BOOT/RST pin
        self.io_rst.off() #  BOTH LOW
        self.io_boot.off() 
        
        time.sleep(0.1)
        self.io_rst.on() # RST=H
        time.sleep(0.1)
        self.io_boot.on() # then BOOT=H
        
        # call external cmd, ex esptool.py    
        #cmd = 'esptool.py xxxxx'
        
        # cmd = 'echo "hello world"; sleep 3; exit %d' %(random.choice([0, 0, 255])) # a fake cmd
        # cmd1 = 'sh /home/pi/Mpod/Gadx/flash.sh | tee /home/pi/Jack/cache.txt'
        
        actionType = None
        cmd_get_bytes = None
        cmd_flash = None
        if self.b1:
            cmd_flash = f"sh flash_only.sh | tee {pathToCache}"
            cmd_get_bytes = "grep -E Wrote.*compressed.*0x00020000 " + pathToCache + " | awk '{print $2}'"   #RC This is for old old style flashing
            actionType = 'flash'

            print('[KEYLED] B1 pressed...', flush=True)
            print("[KEYLED] Attempting to flash...", flush=True)

        if self.b2:
            #cmd_flash = f"sh flash.sh -p /dev/ttyAMA0 -u | tee {pathToCache}"
            cmd_flash = f"sh ../Mpod/flash_package/flash.sh -p /dev/ttyACM0 -u | tee {pathToCache}" #/dev/ttyAMA0 or /dev/ttyACM0
            cmd_get_bytes = "grep -E Wrote.*compressed.*0x00000000 " + pathToCache + " | awk '{print $2}'"   #prov #RC changed to work with new esptool output
            actionType = 'provision'

            print('[KEYLED] B2 pressed...', flush=True)
            print("[KEYLED] Attempting to provision...", flush=True)


        flashResponse = subprocess.run(cmd_flash, shell=True)

        ############## Flash Success Metric ################
            # 1. check for 3 instances of writes to 100%
            # 2. check for 3 instances of verified hash
        #--------------------------------------------------#
        #--------------------------------------------------#
        ############## Provision Success Metric ############
            # 1. check for 14 instances of Successful
            # 2. check for 1 instance of verified hash
        #--------------------------------------------------#
        isSuccess = False
        if actionType == 'flash':
            cmd = f'grep -E -o "Hash of data verified." {pathToCache} | wc -l'
            res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            hashCount = int(res.stdout.strip())

            cmd = f'grep -E -o "Writing at.*(100 %)" {pathToCache} | wc -l'
            res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            writesCount = int(res.stdout.strip())

            if hashCount == 3 and writesCount == 3:
                isSuccess = True

        elif actionType == 'provision':
            cmd = f'grep -E -o "Hash of data verified." {pathToCache} | wc -l'
            res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            hashCount = int(res.stdout.strip())

            cmd = f'grep -E -o "Successful" {pathToCache} | wc -l'
            res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            successfulCount = int(res.stdout.strip())

            if hashCount == 1 and successfulCount == 14:
                isSuccess = True

        # lights
        if isSuccess:
            print(f"[KEYLED] {GREEN} {actionType.capitalize()} Success {RESET}", flush=True)
            # Indicate success with LEDs
            #self.led_ok.pulse(1, 0.1, n=2, background=False)   # don't pulse, instead ..
            self.led_ok.on()    # RC change this to solid on instead of pulsing
            self.led_fault.off()
        else:
            print(f"[KEYLED] {RED} {actionType.capitalize()} Failure {RESET}", flush=True)
            # Indicate failure with LEDs
            self.led_ok.off()
            self.led_fault.on()
            #self.led_fault.pulse(0.1, 0.5, n=5, background=False)


        # Get the date and time from the target's clock
        cmd = "sudo hwclock -r"
        res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        targetRTC = (res.stdout.split("."))[0]
        # print("hwclock -r", targetRTC, flush=True)
        if not targetRTC:
            targetRTC = "NULL"

        # Get the current date and time from Python datetime
        currDateTime = "NULL"
        try:
            currDateTime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        except Exception as err:
            print(f"[ERROR] Couldn't access the current date: {err}", flush=True)

        # Getting MAC address of the target
        cmd = "grep MAC " + pathToCache + " | awk '{print $2}'"
        res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        MAC = res.stdout.strip()
        if not MAC:
            MAC = "NULL"

        # Get the number of bytes written to the target from esptool output
        res = subprocess.run(cmd_get_bytes, shell=True, capture_output=True, text=True)
        bytesWritten = res.stdout.strip()
        if not bytesWritten:
            bytesWritten = 0
        
        # Get the esptool.py version
        cmd = 'grep -E "esptool.py v" ' + pathToCache + " | awk '{print $2}'"
        res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        programVersion = (f"esptool {res.stdout.strip()}")
        if not programVersion:
            programVersion = "NULL"

        # get the device hostname
        cmd = "hostname"
        res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        deviceHostname = res.stdout.strip()
        if not deviceHostname:
            device_hostname = "NULL"

        # Get the RTC drift if the raspberry pi clock was accessed
        RTCDrift = "NULL"
        if (targetRTC != "NULL" and currDateTime != "NULL"):
            targetDate, targetTime = targetRTC.split()
            currDate, currTime = currDateTime.split()
            
            # Split the hardware date and time into components
            targetYear, targetMonth, targetDay = targetDate.split("-")
            targetHour, targetMinute, targetSecond = targetTime.split(":")
                       

            # Split the current time and date into components
            currYear, currMonth, currDay = currDate.split("-")
            currHour, currMinute, currSecond = currTime.split(":")

            # Convert into int
            targetYear, targetDay, targetMonth = int(targetYear), int(targetDay.strip("0")), int(targetMonth)
            targetHour, targetMinute, targetSecond = int(targetHour), int(targetMinute), int(targetSecond)
            currYear, currDay, currMonth = int(currYear), int(currDay.strip("0")), int(currMonth)
            currHour, currMinute, currSecond = int(currHour), int(currMinute), int(currSecond)

            # Create Python datetime objects
            targetDateTimeObject = datetime(targetYear, targetMonth, targetDay, targetHour,targetMinute, targetSecond)
            currDateTimeObject = datetime(currYear, currMonth, currDay, currHour, currMinute, currSecond)

           # Find the difference
            if (currDateTimeObject < targetDateTimeObject):
                difference = targetDateTimeObject - currDateTimeObject
                RTCDrift = f"{difference.days}:{difference}"
            else:
                difference = currDateTimeObject - targetDateTimeObject
                RTCDrift = f"-{difference.days}:{difference}"


        # Get log file number for later
        nextCount = None
        path = f"{hostname}/database/get-entry-count"

        response = safeRequest('GET', path)
        if response is not None:
            status_code = response.status_code
            data = response.json()
            if status_code != 200:
                print(f'[KEYLED] Unable to get entry count: {data}')
            else:
                print(f'[KEYLED] Successfully retrieved entry count')
                nextCount = data["count"] + 1
        else:
            print('[KEYLED] Unable to get entry count: Connection timed out')
                

        # store values in the provisioning and flashing tracker
        path = f"{hostname}/database/insert/target"
        values = {}
        if isSuccess: # will change to check isSuccess
            # Success
            values = {"serial_number": MAC, 
                      "status": True, 
                      "bytes_written": bytesWritten, 
                      "program_version": programVersion, 
                      "target_RTC": targetRTC,
                      "flash_date": currDateTime,
                      "RTC_drift": RTCDrift,
                      "flash_provision": actionType,
                      "hostname": deviceHostname,
                      "reader_number": readerNumber,
                      "logs": "NULL"
                    }

        # Failure
        else:
            values = {"serial_number": "NULL",
                      "status": False,
                      "bytes_written": 0,
                      "program_version": programVersion,
                      "target_RTC": "NULL",
                      "flash_date": currDateTime,
                      "RTC_drift": RTCDrift,
                      "flash_provision": actionType,
                      "hostname": device_hostname,
                      "reader_number": readerNumber,
                      "logs": "NULL"
                    }

        # Include the flash/provision logs in the remote database entry (values)
        try:
            flash_log = Path(pathToCache).read_text(
                encoding="utf-8",
                errors="replace"
            )
            values["logs"] = flash_log
        except Exception as err:
            print(f"[KEYLED] {RED} Unable to include the flash/provision log into the remote database upload: {err}{RESET}", flush=True)
            values["logs"] = 'NULL'


        # Put values into remote database
        response = safeRequest(method='POST', url=path, json=values)
        if response is not None:
            status_code = response.status_code
            data = response.json()
            if status_code != 200:
                print(f"[KEYLED] {RED} Unable to update remote database: {data} {RESET}", flush=True)
            else:
                print(f"[KEYLED] {GREEN} Remote database successfully updated: {data} {RESET}", flush=True)
        else:
            print(f'[KEYLED] {RED} Unable to update remote database: Connection timed out {RESET}', flush=True)
        

        # Copy cache (cache is the output of flash.sh) to log file
        try:
            source = Path(pathToCache)
            targetDir = Path(pathToLogs)
            targetDir.mkdir(parents=True, exist_ok=True)

            newFile = f"{actionType}_{nextCount}_log.txt"
            destinationFile = targetDir / newFile
            shutil.copy2(source, destinationFile)

            print(f"[KEYLED] Created log file for {actionType} id #{nextCount} at {targetDir}/{newFile}", flush=True)
        except Exception as err:
            print(f"[KEYLED] Unable to create log file for {actionType} id #{nextCount}: {err}", flush=True)

    
        # Clear cache
        try:
            with open (pathToCache, "w") as cache:
                pass
                print("[KEYLED] Cache successfully cleared", flush=True)
        except Exception as err:
            print(f"[KEYLED] Unable to clear cache: {err}", flush=True)

        
        self.led_ready.off()
        # set BOOT/ RST pin
        self.io_rst.off() # At end or programming,RST = LOW                    
        self.io_boot.off() # set                   BOOT=LOW
        
        
        if flashResponse.returncode == 0:          
            # self.led_fault.off()
            # self.led_ok.pulse(1, 0.1, n=2, background=False)
            print("[KEYLED] Flash.sh exited successfully with exit code 0", flush=True)
        else:
            self.led_ok.off()
            self.led_fault.pulse(0.1, 0.5, n=5, background=False)


############################
if __name__ == '__main__':
    
    prog = Prog()
    prog.start()

