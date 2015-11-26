#!/usr/bin/env bash
SSHPASSWORD=${SSHPASSWORD:-'sshpassword'}
SSHUSER=${SSHUSER:-'root'}

useradd -ou 0 -g 0 $SSHUSER
SSHPASSWORD=${SSHPASSWORD:-'sshpassword'}
echo "$SSHUSER:$SSHPASSWORD" | chpasswd