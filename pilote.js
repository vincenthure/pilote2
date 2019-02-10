module.exports = function()
    {
    const LOOP_TIME = 20
 
    console.log("starting pilote")

    const exeCute = require('exe')

    const CAPTEUR = require('./capteur')
    const Capteur = new CAPTEUR()

    const CALIBRATION = require('./calibration')
    const calibration = new CALIBRATION()

    const AHRS = require('ahrs')
    const ahrs = new AHRS
        ({
        sampleInterval: LOOP_TIME,
        algorithm: 'Mahony',   //  'Madgwick',
 //     beta: 0.4,
        kp: 0.5,
        ki: 0
        });

    const Controller = require('./pid')
    const pid        = new Controller(LOOP_TIME)

//*********** Boucle **********************************

    var timerID = setInterval(function()
        {
        let capteur = calibration.update(Capteur.get())

        ahrs.update(capteur.gx, capteur.gy, capteur.gz,
                    capteur.ax, capteur.ay, capteur.az,
                    capteur.mx, capteur.my, capteur.mz
                    )
 
        pid.update(ahrs.getEulerAngles().heading)
        },LOOP_TIME );

//************ initialise le cap au bout de 3 secondes ***************

    setTimeout(function(){ pid.set_cap_to_heading() }, 3000)

//***************** fonction ***************************

    this.Data = function()
        {
        const buf = Buffer.allocUnsafe(12);
        buf.writeFloatBE(pid.get_error(), 0);
        buf.writeFloatBE(pid.get_output(), 4);
        buf.writeFloatBE(pid.get_heading(), 8);
        return buf;
        }
        
    this.Stanby = function()
       {
        const buf = Buffer.allocUnsafe(1);
        buf.writeUInt8(pid.get_stanby(), 0);
        return buf;
        }		

    this.Capteur = function()
        {
        const buf = Buffer.allocUnsafe(36);
        buf.writeFloatBE(capteur.ax, 0);
        buf.writeFloatBE(capteur.ay, 4);
        buf.writeFloatBE(capteur.az, 8);
        buf.writeFloatBE(capteur.mx,12);
        buf.writeFloatBE(capteur.my,16);
        buf.writeFloatBE(capteur.mz,20);
        buf.writeFloatBE(capteur.gx,24);
        buf.writeFloatBE(capteur.gy,28);
        buf.writeFloatBE(capteur.gz,32);
        return buf;
        }

    this.CapGet = function()
        {
        const buf = Buffer.allocUnsafe(4);
        buf.writeFloatBE(pid.get_cap(), 0);
        return buf;
        }
     
    this.Pid = function()
        {
        return pid.get_Kpid()
        }
                
    this.Calibration = function()
        {
        return calibration.get()
        }

    this.magnetoSave = function(buf)
        {
        calibration.magnetoSave(buf)
        }

    this.commande = function(value)
        {
        var fnc = Buffer.from(value).toString();
        switch (fnc)
                {
                case "kp-"         :    pid.set_kp(-1)
                                        break;
                                
                case "kp+"         :    pid.set_kp(1)
                                        break;
 
                case "ki-"         :    pid.set_ki(-1)
                                        break;
                                
                case "ki+"         :    pid.set_ki(1)
                                        break;
                                
                case "kd-"         :    pid.set_kd(-1)
                                        break;
                                
                case "kd+"         :    pid.set_kd(1)
                                        break;
                
                case "cap--"       :    console.log("cap -10");
                                        pid.set_cap(-10)
                                        break;
                                
                case "cap-"        :    console.log("cap +1");
                                        pid.set_cap(-1)
                                        break;
 
                case "capset"      :    console.log("cap to heading");
                                        pid.set_cap_to_heading()
                                        break;
                                
                case "cap+"        :    console.log("cap +1");
                                        pid.set_cap(1)
                                        break;
                                
                case "cap++"       :    console.log("cap +10");
                                        pid.set_cap(10)
                                        break;
                
                case "stanby"      :    console.log("stanby");
                                        pid.change_stanby()
                                        break;
                
                case 'shutdown'    :    console.log("shutdown")
                                        exeCute("sudo shutdown now")
                                        break
							
                case 'reboot'      :    console.log("reboot")
                                        exeCute("sudo reboot")
                                        break

                case 'service'     :    console.log("service")
                                        exeCute("sudo systemctl restart pilote.service")
                                        break

                case 'gyroSave'    :    calibration.gyroSave(capteur)
                                        break
                }
        }      
    }

