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

client_package_location=/home/$username/client_package

mkdir $client_package_location

#transfer the variables specific for this terminal and configuration to the client setup package
echo '#!/usr/bin/env bash' > $client_package_location/terminal_vars.sh
echo "username=$username;
server_addr=$server_addr;
ssh_port=$ssh_port;
id=$id;" >> $client_package_location/terminal_vars.sh

cp /home/$username/.ssh/client_to_server $client_package_location/client_to_server
cp /home/$username/.ssh/server_to_client.pub $client_package_location/server_to_client.pub
pwd
cp setup_terminal/client_setup_script.sh $client_package_location

echo "generating a client_package.tar.gz file in /home/$username. This needs to be transferred to the terminal offband."
tar -C /home/$username/ -zcvf /home/$username/client_package.tar.gz .
echo "removing the terminal access rights from user \"$username\". (To minimize posiblility of malicous activity)"
usermod -s /bin/false ${username}
