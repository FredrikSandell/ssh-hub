FROM nodesource/precise:0.10.30
RUN mkdir /ssh-hub
RUN mkdir /ssh-hub/log
WORKDIR /ssh-hub
ADD package.json package.json
RUN npm install
ADD . .
#RUN  ln -sf /dev/stdout /ssh-hub/log/ssh-hub.log
#RUN  ln -sf /dev/stderr /ssh-hub/log/ssh-hub.log

RUN apt-get update
RUN apt-get -y install sudo supervisor openssh-server

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY init_docker_ssh.sh /root/init_docker_ssh.sh

RUN mkdir /var/run/sshd
RUN echo 'root:sshpassword' | chpasswd
RUN sed -i 's/PermitRootLogin without-password/PermitRootLogin yes/' /etc/ssh/sshd_config

# SSH login fix. Otherwise user is kicked off after login
RUN sed 's@session\s*required\s*pam_loginuid.so@session optional pam_loginuid.so@g' -i /etc/pam.d/sshd

ENV NOTVISIBLE "in users profile"
RUN echo "export VISIBLE=now" >> /etc/profile

CMD ["/usr/bin/supervisord"]


#CMD ["/usr/sbin/sshd", "-D"]

#CMD ["node", "js/main.js"]
#CMD /ssh-hub/startup.sh