# pilote2

Installer raspbian lite sur carte Sd
configurer le RPI en mode console acec sudo raspi-config


hostname :  pilote
password :  admin
SSH : on
reboot : console login as pi
Location, clavier...
Wifi

Se connecter par un autre ordi en mode console
ssh pi@remote.local

login pi

password admin

exectuter les commandes contenu dans le fichier configuration/intall.sh



gestion du service

fichier /etc/systemd/system/pilote.service

sudo systemctl start pilote.service

sudo systemctl enable pilote.service

sudo systemctl restart pilote.service

sudo systemctl stop pilote.service

sudo systemctl status pilote.service

journalctl -u pilote.service