---
layout: posts
classes: wide
title: "Basic Bash Backup"
date: 2019-05-18
tags: unix bash
---

I spent most of early Saturday morning finishing up my backup scripts and
debugging Bash. One could say I was,  _Bashing_ my head against the wall. No
need to laugh, the bad pun was waiting to be made.

Long story short, this is going to be about these script that I re-wrote to work on my Arch Linux laptop.

`folder_bkup`

```sh

#!/bin/bash
echo "Beginning backup of directories:"
echo "Reading from file"
directories=()
inputf="/home/cam/.config/bkfiles"
while IFS= read -r fname
do
	directories+=("$fname")
done < "$inputf"


folders=()
files=()
ago="$( date +%s -d "1 day ago" )"
datestamp="$( date +%F-%H )" # date in yyyy-mm-dd-hh format
bkfile="$datestamp-backup.zip"

for name in "${directories[@]}"; do
	if [ -f "$name" ]
	then
		echo "$name"
		files+=("$name")
	else
		echo "./$name"
		folders+=("$name")
	fi
done

echo "---------------------Folders----------------------------"
for i in "${folders[@]}";do
	echo "$i"
	zip -r "$bkfile" "$i"
done
echo "---------------------Files------------------------------"
for i in "${files[@]}";do
	echo "$i"
	zip "$bkfile" "$i"
done
echo "Moving to backup drive"
external="/mnt/backup-data"
if [ $( mount | grep -c $external ) == 1 ]; then
	mv "$bkfile" "$external/"
else
	mv "$bkfile" "/home/cam/"
fi
```

`make_space`
```sh
#!/bin/bash
targetdir="/mnt/backup-data"
d=$( date +%s -d "15 days ago")
cap=$(( 58 * 1000 ** 3 ))

if [ "$( du $targetdir | tr -dc '0-9' )" -ge "$cap" ]; then
	echo "Checking and Erasing..."
	echo "Erasing old files on $( date )" > /home/cam/backup.log

	for fname in $targetdir/*; do
		if [ "$( date -r $fname +%s )" -le "$d" ] || [ "$( du $targetdir | tr -dc '0-9' )" -ge "$cap" ]; then
			echo "Removing $fname" > /home/cam/backup.log
			rm $fname
		fi
	done
fi
echo "Finished... at $( date )" > /home/cam/backup.log
```
