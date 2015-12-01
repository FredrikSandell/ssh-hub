#!/usr/bin/env bash
if getent passwd $1 > /dev/null 2>&1; then
    #The user exists, do nothing
    echo "The user $1 already exist."
else
    #The user does not previously exist
    echo "The user $1 does not exist. Adding user $1"
    adduser --uid $2 --disabled-password --gecos \"\" $1
fi
