#!/usr/bin/env bash
if [ -z "$1" ]
  then
    echo "You need to supply the ID of the terminal that you want to attach to. E.g. 40001"
fi
ssh -i /home/terminal$1/.ssh/server_to_client terminal$1@127.0.0.1 -p $1
