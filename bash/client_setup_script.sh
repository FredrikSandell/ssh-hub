#!/usr/bin/env bash

echo "Ensuring that ssh is installed"
apt-get install ssh -y

echo "Ensuring that autossh is installed"
apt-get install autossh -y

server_port=$(cat server_port.txt)
username=$(cat username.txt)
server_addr=$(cat server_addr.txt)
ssh_port=$(cat ssh_port.txt)

echo "Creating user $username"
adduser --disabled-password --gecos \"\" $username

mkdir -p /home/$username/.ssh

echo "Installing server key (To let server access the device)"
cat server_to_client.pub >> /home/$username/.ssh/authorized_keys

chown /home/$username $username:$username

#TODO: below is not tested fully yet
echo "Adding user $username to sudoers"
sudo usermod -a -G sudo $username

#generate the command which will set up a persistent reverse tunnel to the ssh hub instance
autossh_startup_line="autossh -M 10984 -o \"PubkeyAuthentication=yes\" -o \"PasswordAuthentication=no\" -i client_to_server -N -R $server_port:localhost:22 $username@$server_addr -p $ssh_port &"

echo "Installing the reverse tunnel command in /etc/rc.local to ensure that it is run at each startup"
echo $autossh_startup_line >> /etc/rc.local

echo "Starting the reverse tunnel"
eval $autossh_startup_line
