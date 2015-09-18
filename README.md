# ssh-hub

A reverse ssh tunnel system for remote access to distributed SOCs.

What problem does it solve?

When using SOCs, such as raspberrypi, it is often the case that the units needs to be left at physical locations that are hard to reach. Whatever the function the SOC is performing secure remote access to the device is often desirable in order to troubleshoot or upgrade software etc. Addressing the SOC can be troublesome due to unknown/changeing network conditions. E.g. if the SOC is connected to the network through a 3G modem.

How ssh-hub solve the problem?

The simplest way of guaranteeing remote access to a device which is not publicly accessible is to let the device itself connect to a known server. This is what ssh-hub does. ssh-hub generates the configuration required to let a remote SOC create a "persistent" reverse ssh tunnel against a ssh server; giving administrators root ssh access to all connected SOC units. 

Prerequisites
1. A remote server with a public URL. The SOC units need to be able to uniquely address the server.
2. An ssh daemon installed on the server. (Publicly accessible)
3. Nodejs and npm needs to be installed on the server. I used nodejs version v0.10.25.
4. I tested the implementation using Ubuntu server 14. Any debian based system will probably work. For other distribution you may need to modify the scripts a bit. Please make pull requests for a more generic solution to the scripts! Bash is not my first language. 

5. The SOC that I used when testing this was a Raspberry. This in it self is not important but the fact that I used NOOBS 1.4.1 (raspbian version "May 2015") is important. Raspbian is based on debian, in this case Debian Wheezy. Once again, if you are using another distribution the scripts may need to be altered a bit.
6. The SOC needs to have a network connection! :)

How do I use it?

1. Clone the repository.
2. cd to repository. install depencencies with "npm install"
3. Configure your instance by modifying the config/default.json. Should be self explanatory.
4. start the server from the project root with by running something like: nodejs js/main.js
5. Use the REST interface the server provides to prepare for a new "terminal". Terminal is the term for SOC devices connected to the server. This can be done by executing a request against createNewTerminal (listed below)
6. After that is done, log in to the SOC with a sudo enabled account and execute "bash <(curl -s http://{server_addr}:3001/setup/terminal{terminalId})". Follow the instructions. That's it! After that you should have a permanent reverse ssh tunnel against you server.
7. Test the tunnel by executing runOnTerminal with 'echo "hello world"' as a body. Alternatively execute the attach_to_client.sh script with the terminalId as a parameter, e.g. "bash bash/attach_to_client.sh 40001". This will open a ssh session against that terminal. Please note that the terminal user is a no password sudo user on the terminal. 

API (I was too lazy to do swagger)
All requests have "Content-Type: application/json" if nothing else is specified
All requests have basic auth protection if nothing else is specified

listTerminals:
GET /terminals
Returns a list of all terminals

getTerminal
GET /terminals/{terminalId}
Returns a single terminal

removeTerminal
DELETE /terminals/{terminalId}
Remove a specific terminal

createTerminal
POST /terminals
Body example:
{
  description : "Terminal in kitchen"
}
Returns the new terminal data with a log of what was done on the server to prepare it for connections.

dropAll
DELETE /terminals
removes all terminals

runOnTerminal
Content-Type: text/plain
POST /terminals/{terminalId}/run
example body: 'echo "hello"'
executes a command on a the specified terminal. (It opens a ssh connection through the reverse tunnel and executes the command and return stdout&stderr)

setupTerminal
No basic auth protection
GET /setup/terminal{terminalId}
returns a bootstrap bash script which setups the client. Intended to be run on the SOC like so: "bash <(curl -s http://{SERVER_ADDRESS}:3001/setup/terminal{terminalId})"
