module.exports = function()
    {
    const LOOP_TIME = 20
    const SMOOTH    = 0.1

    console.log("starting IMU")

    const exeCute = require('exe')

    const CAPTEUR = require('./capteur')
    const capteur = new CAPTEUR()

    const CALIBRATION = require('./calibration')
    const calibration = new CALIBRATION()

    const AHRS = require('ahrs')
    const ahrs = new AHRS
        ({
        sampleInterval: LOOP_TIME,
        algorithm: 'Madgwick',
        beta: 0.4,
        kp: 0.5,
        ki: 0
        });

    const Controller = require('./pid')
    const pid        = new Controller(LOOP_TIME)

    const capt=   
        {
        gx : 0, gy : 0, gz : 0,
        ax : 0, ay : 0, az : 0,
        gx : 0, gy : 0, gz : 0
        }

    const calib=   
        {
        gx : 0, gy : 0, gz : 0,
        ax : 0, ay : 0, az : 0,
        gx : 0, gy : 0, gz : 0
        }

    const PI180 = -57.29577951308233

    const LPF     = require("lpf")
    LPF.smoothing = SMOOTH;
    LPF.init([0,0,0,0,0,0,0,0,0,0]);

    var heading;

//*********** Boucle **********************************

    var timerID = setInterval(function()
        {
        capteur.get(capt)

        calibration.adjust(capt,calib)

        ahrs.update(calib.gx, calib.gy, calib.gz,
                    calib.ax, calib.ay, calib.az,
                    calib.mx, calib.my, calib.mz
                    )
        heading = LPF.next(ahrs.getEulerAngles().heading) * PI180
        pid.update(heading)
        },LOOP_TIME );

//************ initialise le cap au bout de 3 secondes ***************

    setTimeout(function(){ pid.set_cap_to_heading(heading) }, 3000)

//***************** fonction ***************************

    this.Data = function()
        {
        const buf = Buffer.allocUnsafe(8);
        buf.writeFloatBE(pid.get_error(), 0);
        buf.writeFloatBE(pid.get_output(), 4);
        return buf;
        }

    this.Capteur = function()
        {
        const buf = Buffer.allocUnsafe(36);
        buf.writeFloatBE(capt.ax, 0);
        buf.writeFloatBE(capt.ay, 4);
        buf.writeFloatBE(capt.az, 8);
        buf.writeFloatBE(capt.mx,12);
        buf.writeFloatBE(capt.my,16);
        buf.writeFloatBE(capt.mz,20);
        buf.writeFloatBE(capt.gx,24);
        buf.writeFloatBE(capt.gy,28);
        buf.writeFloatBE(capt.gz,32);
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
                                        pid.set_cap_to_heading(heading)
                                        break;
                                
                case "cap+"        :    console.log("cap +1");
                                        pid.set_cap(1)
                                        break;
                                
                case "cap++"       :    console.log("cap +10");
                                        pid.set_cap(10)
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

                case 'gyroSave'    :    calibration.gyroSave(capt)
                                        break
                }
        }      
    }

