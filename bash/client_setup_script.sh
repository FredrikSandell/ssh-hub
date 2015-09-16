#!/usr/bin/env bash

echo "Ensuring that ssh is installed"
apt-get install ssh -y

echo "Ensuring that autossh is installed"
apt-get install autossh -y

#getting the variables specific for this terminal
source terminal_vars.sh

echo "Creating user $username"
adduser --disabled-password --gecos \"\" $username

mkdir -p /home/$username/.ssh

echo "Installing server key (To let server access the device)"
cat server_to_client.pub >> /home/$username/.ssh/authorized_keys
echo "Installing key to known hosts"
ssh-keyscan -H $server_addr >> /home/$username/.ssh/known_hosts
echo "Installing client_to_server key"
cp client_to_server /home/$username/

chown -R $username:$username /home/$username
chown -R $username:$username /home/$username/.ssh

#TODO: below is not tested fully yet
echo "Adding user $username to sudoers"
usermod -a -G sudo $username
echo "Enable sudo execution without password prompt"
cp /etc/sudoers /etc/sudoers.tmp
chmod ugo+w /etc/sudoers.tmp
echo "$username ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers.tmp
chmod 400 /etc/sudoers.tmp
mv /etc/sudoers.tmp /etc/sudoers


#generate the command which will set up a persistent reverse tunnel to the ssh hub instance
autossh_startup_line="su $username -c 'autossh -M 10984 -o \"PubkeyAuthentication=yes\" -o \"PasswordAuthentication=no\" -i /home/$username/client_to_server -N -R $id:localhost:22 $username@$server_addr -p $ssh_port &'"

echo "Installing the reverse tunnel command in /etc/rc.local to ensure that it is run at each startup"
echo $autossh_startup_line > /home/$username/start_reverse_tunnel.sh
chown $username:$username /home/$username/start_reverse_tunnel.sh
chmod 755 /home/$username/start_reverse_tunnel.sh
#append the startup command script before the last row in the rc.local. The last row is usually "exit 0"
sed -i -e '$i \nohup sh /home/'$username'/start_reverse_tunnel.sh &\n' /etc/rc.local

echo "Starting the reverse tunnel"
eval $autossh_startup_line
