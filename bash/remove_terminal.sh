#!/usr/bin/env bash
id=$1
username="terminal${id}"
userdel $username
rm -rf /home/$username
