module.exports = function(val)
    {
    const loop_time = val

    const CAPTEUR = require('./capteur')
    const Capteur = new CAPTEUR()

    const CALIBRATION = require('./calibration')
    const calibration = new CALIBRATION()

    const AHRS = require('ahrs')
    const ahrs = new AHRS
        ({
        sampleInterval: loop_time,
        algorithm: 'Mahony',   //  'Madgwick',
 //     beta: 0.4,
        kp: 0.5,
        ki: 0
        });
        
    var heading = 0;
    var capteur = 
		{        
        ax:0, ay:0, az:0,
        gx:0, gy:0, gz:0,
        mx:0, my:0, mz:0
        }

    var timerID = setInterval(function()
        {
        capteur = calibration.update(Capteur.get())

        ahrs.update(capteur.gx, capteur.gy, capteur.gz,
                    capteur.ax, capteur.ay, capteur.az,
                    capteur.mx, capteur.my, capteur.mz
                    )
 
        let h = ahrs.getEulerAngles().heading * -57.29577951308233
        heading = h<0 ? h +=360 : h

        },loop_time );
        
   this.get_heading = function()
		{        
        return heading
        } 

   this.get_capteur = function()
		{        
        return capteur
        }      
   
   this.get_calibration = function()
		{        
        return calibration.get()
        }      

   this.magnetoSave = function(buff)
		{        
        calibration.magnetoSave(buff)
        } 
    
   this.gyroSave = function(buff)
		{        
        calibration.gyroSave(capteur)
        }      
    }

