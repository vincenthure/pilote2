module.exports = function()
    {
    console.log("starting IMU")

    const exeCute = require('exe')

    const LOOP_TIME = 20

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

    const PID = require('./pid')
    const pid = new PID()

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

    var heading, cap=0
    var input, output

//*********** Boucle **********************************

    var timerID = setInterval(function()
        {
        capteur.get(capt)

        calibration.adjust(capt,calib)

        ahrs.update(calib.gx, calib.gy, calib.gz,
                    calib.ax, calib.ay, calib.az,
                    calib.mx, calib.my, calib.mz
                    )

        heading = ahrs.getEulerAngles().heading*-57.29;

        if( heading<180 && cap<180 )   input = heading-cap;
        if( heading>180 && cap>180 )   input = heading-cap;
        if( heading<180 && cap>180 )   input = heading-cap-360;
        if( heading>180 && cap<180 )   input = 360-cap+heading;

        output = pid.update(input)

        },LOOP_TIME );

//************ initialise le cap au bout de 3 secondes ***************

    setTimeout(function(){ cap = heading; }, 3000)

//***************** fonction ***************************

    this.Data = function()
        {
        const buf = Buffer.allocUnsafe(8);
        buf.writeFloatBE(input, 0);
        buf.writeFloatBE(output, 4);
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
        buf.writeFloatBE(cap, 0);
        return buf;
        }
     
    this.Pid = function()
        {
        return pid.get()
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
                case "kp-"         :    pid.kp(-1)
                                        break;
                                
                case "kp+"         :    pid.kp(1)
                                        break;
 
                case "ki-"         :    pid.ki(-1)
                                        break;
                                
                case "ki+"         :    pid.ki(1)
                                        break;
                                
                case "kd-"         :    pid.kd(-1)
                                        break;
                                
                case "kd+"         :    pid.kd(1)
                                        break;
                
                case "cap--"       :    console.log("cap -1");
                                        cap -= 10;
                                        break;
                                
                case "cap-"        :    console.log("cap +1");
                                        cap -= 1;
                                        break;
 
                case "capset"      :    console.log("cap to heading");
                                        cap = heading;
                                        break;
                                
                case "cap+"        :    console.log("cap +1");
                                        cap += 1;
                                        break;
                                
                case "cap++"       :    console.log("cap +10");
                                        cap += 10;
                                        break;
                
                case 'shutdown'    :    console.log("shutdown")
                                        exeCute("sudo shutdown now")
                                        break
							
                case 'reboot'      :    console.log("reboot")
                                        exeCute("sudo reboot")
                                        break

                case 'gyroSave'    :    calibration.gyroSave(capt)
                                        break
                }
        }      
    }

