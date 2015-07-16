#!/usr/bin/env bash
id=$1
server_addr=$2
ssh_port=$3
username="terminal${id}"

echo "adding user ${username}"
adduser --disabled-password --gecos \"\" $username

echo "making .ssh folder in home dir"
sudo -u $username mkdir /home/$username/.ssh

echo "generating client to server keys"
sudo -u $username ssh-keygen -f /home/$username/.ssh/client_to_server -t rsa -N ''
cat /home/$username/.ssh/client_to_server.pub >> /home/$username/.ssh/authorized_keys

echo "generating server to client keys"
sudo -u $username ssh-keygen -f /home/$username/.ssh/server_to_client -t rsa -N ''

mkdir /home/$username/client_package
echo "$username" > /home/$username/client_package/username.txt
echo "$server_addr" > /home/$username/client_package/server_addr.txt
echo "$ssh_port" > /home/$username/client_package/ssh_port.txt
echo "$id" > /home/$username/client_package/server_port.txt
cp /home/$username/.ssh/client_to_server /home/$username/client_package/client_to_server
cp /home/$username/.ssh/server_to_client.pub /home/$username/client_package/server_to_client.pub
pwd
cp setup_terminal/client_setup_script.sh /home/$username/client_package

tar -C /home/$username/ -zcvf /home/$username/client_package.tar.gz .
#usermod -s /bin/false ${username}
