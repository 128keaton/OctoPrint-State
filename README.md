# OctoPrint State [![npm version](https://badge.fury.io/js/octoprint-state.svg)](https://badge.fury.io/js/octoprint-state)

Sets bed temp to a reasonable value during working hours, typically used in conjunction with cron

```shell
$ npm i -g printer-state
```

### Usage

```shell
#                     ENDPOINT             API_KEY   TARGET_TEMP        
$ printer-state check http://192.168.1.242 123123123 75         
```

### Example

1. Install the package globally using npm:
```shell
$ npm i -g printer-state
```

2. Create a script inside of `/home/pi/scripts/` (or anywhere really) with the contents:
```shell
#!/bin/bash

NODE=/home/pi/.nvm/versions/node/v16.15.0/bin/node          # Run `which node` to get this path
CMD=/home/pi/.nvm/versions/node/v16.15.0/bin/printer-state  # Run `which printer-state` to get this path
KEY=B52C9459DE264027B99611360332B750                        # Replace this with your API key
TARGET=75                                                   # Replace this with your target bed temperature
HOST=http://localhost                                       # Replace this with the url to your OctoPrint host
LOG_OUTPUT=/home/pi/printer-state.log                       # Replace this with the log file path you'd like to use (or not)

$NODE $CMD check $HOST $KEY $TARGET > $LOG_OUTPUT 2>&1
```

I named my script `check-temp.sh`. Do not forget to set the executable bit:
```shell
$ chmod +x ./check-temp.sh
```

I am using this script as a wrapper to pass my arguments and save the output in a log file

3. Use `cron` to check the printer every 5 minutes, M-F:
```shell
$ crontab -e # this opens the cron editor
```

```shell
*/5 * * * 1-5 /home/pi/scripts/check-temp.sh  # replace this with your script's path
```
