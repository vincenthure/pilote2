# pilote2

sudo apt-get install git
sudo apt-get update
sudo apt-get install libudev-dev

# instalation nodejs

curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt install -y nodejs

# ouvrir nodejs sans sudo

#sudo apt-get install libcap2-bin
#sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)

# recuparation du programme pilote et des modules nodejs

git clone https://github.com/vincenthure/pilote2.git
cd ~/pilote2
npm install

# installation et gestion du service pilote

cd ~/pilote2/installation
sudo cp pilote.service /etc/systemd/system
sudo systemctl enable pilote.service   

sudo reboot