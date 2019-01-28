console.log("starting IMU")

const async   = require("async")
const i2c     = require("i2c-bus")
const AHRS    = require('ahrs')
const Store   = require('data-store')
const exeCute = require('exe')

const store = new Store({ path: '/home/pi/pilote.json' })

const FXOS8700          = 31  // magnetometre , accelerometre
const MAG_WHO_I_AM      = 13
const MAG_XYZ_DATA_CFG  = 14
const MAG_CTRL_REG1     = 42
const MAG_CTRL_REG2     = 43
const MAG_MCTRL_REG1    = 91
const MAG_MCTRL_REG2    = 92
const MAG_SENSITIVITY   = 0.000244;    //  2G

const FXAS210002        = 33  // gyroscope
const GYRO_WHO_I_AM     = 12
const GYRO_REG0         = 13
const GYRO_REG1         = 19
const GYRO_SENSITIVITY  = 0.00027270  //  500DPS

const DATA              = 1
const LOOP_TIME         = 20


var ahrs = new AHRS
    ({
    sampleInterval: LOOP_TIME,
    algorithm: 'Madgwick',
    beta: 0.4,
    kp: 0.5,
    ki: 0
    });

var i2c1  = i2c.openSync(1)
var buff1 = new Buffer(12)
var buff2 = new Buffer(6)

var x,y,z,
    ax,ay,az,
    mx,my,mz,
    mx2,my2,mz2,
    gx,gy,gz,
    gxb,gyb,gzb,
    heading,cap,
    Vi=0,
    Vp,Vd,last_Vp,
    output,pwm,reverse;
    
var Kp = store.get('kp'),
    Ki = store.get('ki'),
    Kd = store.get('kd')
    
if (typeof Kp === "undefined") Kp=15
if (typeof Ki === "undefined") Ki=10
if (typeof Kd === "undefined") Kd=5

var gxo = store.get('gxo'),
    gyo = store.get('gyo'),
    gzo = store.get('gzo')
    
if (typeof gxo === "undefined") gxo=0
if (typeof gyo === "undefined") gyo=0
if (typeof gzo === "undefined") gzo=0

var mxo = store.get('mxo'),
    myo = store.get('myo'),
    mzo = store.get('mzo')
    
if (typeof mxo === "undefined") mxo=0
if (typeof myo === "undefined") myo=0
if (typeof mzo === "undefined") mzo=0

//************** Initialisatin Capteur **************

i2c1.writeByteSync(FXOS8700,   MAG_CTRL_REG1,    0x00);
i2c1.writeByteSync(FXOS8700,   MAG_XYZ_DATA_CFG, 0x00);
i2c1.writeByteSync(FXOS8700,   MAG_CTRL_REG2,    0x02);
i2c1.writeByteSync(FXOS8700,   MAG_CTRL_REG1,    0x15);
i2c1.writeByteSync(FXOS8700,   MAG_MCTRL_REG1,   0x1F);
i2c1.writeByteSync(FXOS8700,   MAG_MCTRL_REG2,   0x20);

i2c1.writeByteSync(FXAS210002, GYRO_REG1,    0x00);
i2c1.writeByteSync(FXAS210002, GYRO_REG0,    0x02);
i2c1.writeByteSync(FXAS210002, GYRO_REG1,    0x0E);

//****************  Boucle **************************


var timerID = setInterval(function()
    {
    async.parallel
        (
            [
            function(cb) { i2c1.readI2cBlock(FXOS8700,   DATA, 12, buff1, cb); },
            function(cb) { i2c1.readI2cBlock(FXAS210002, DATA, 6,  buff2, cb); }
            ],

            function(err, results) 
                {
   //****************  ACCELEROMETRE *****************

                x = ((buff1[0] << 8) | buff1[1])>>2;
                y = ((buff1[2] << 8) | buff1[3])>>2;
                z = ((buff1[4] << 8) | buff1[5])>>2;

                if(x > 0x1FFF)  x -= 0x3FFF;
                if(y > 0x1FFF)  y -= 0x3FFF;
                if(z > 0x1FFF)  z -= 0x3FFF;

                ax = x*MAG_SENSITIVITY;  
                ay = y*MAG_SENSITIVITY;  
                az = z*MAG_SENSITIVITY; 

   //***************** MAGNETOMETRE *******************
                
                x = ((buff1[6]  << 8) | buff1[7]);
                y = ((buff1[8]  << 8) | buff1[9]);
                z = ((buff1[10] << 8) | buff1[11]);

                if(x > 0x7FFF)  x -= 0xFFFF;
                if(y > 0x7FFF)  y -= 0xFFFF;
                if(z > 0x7FFF)  z -= 0xFFFF;
                
                mx = x;
                my = y;
                mz = z;
                
                mx2 = mx - mxo
                my2 = my - myo
                mz2 = mz - mzo
                //console.log(mx+"  "+my+"  "+mz)
            
   //******************* GYRO ******************
            
                x = ((buff2[0] << 8) | buff2[1]);
                y = ((buff2[2] << 8) | buff2[3]);
                z = ((buff2[4] << 8) | buff2[5]);

                if(x > 0x3FFF)  x -= 0xFFFF;
                if(y > 0x3FFF)  y -= 0xFFFF;
                if(z > 0x3FFF)  z -= 0xFFFF;
                
                gxb = x;
                gyb = y;
                gzb = z;

                gx = (gxb-gxo)*GYRO_SENSITIVITY; 
                gy = (gyb-gyo)*GYRO_SENSITIVITY;
                gz = (gyb-gzo)*GYRO_SENSITIVITY;
                
                
   //************** Madgwick Filter ************
            
                ahrs.update(gx,gy,gz,ax,ay,az,mx2,my2,mz2);
                heading = ahrs.getEulerAngles().heading*-57.29;
           //     console.log(Math.round(heading))
                
    //***************** pid *********************
    
                        
                if( heading<180 && cap<180 )   Vp = heading-cap;
                if( heading>180 && cap>180 )   Vp = heading-cap;
                if( heading<180 && cap>180 )   Vp = heading-cap-360;
                if( heading>180 && cap<180 )   Vp = 360-cap+heading;
    
                Vi     += Vp;
                Vi      = Math.min(Vi, 1000/Ki);
                Vi      = Math.max(Vi,-1000/Ki);
                Vd      = Vp - last_Vp;
                last_Vp = Vp;

                output  = ((Kp*Vp) + (Ki*Vi) + (Kd*Vd))/10;
                output  = Math.min(output,100);
                output  = Math.max(output,-100);

                pwm     = Math.abs(output);
                reverse = (output>0)?true:false;
                }
        );
    },LOOP_TIME
    );

//************ initialise le cap au bout de 3 secondes ***************

setTimeout(function()
                {
                cap = heading;
                Vi  = 0;
                }
                , 3000)

module.exports = function()
    {
    this.Data = function()
        {
        const buf = Buffer.allocUnsafe(8);
        buf.writeFloatBE(Vp, 0);
        buf.writeFloatBE(output, 4);
        return buf;
        }

    this.Capteur = function()
        {
        const buf = Buffer.allocUnsafe(36);
        buf.writeFloatBE(ax, 0);
        buf.writeFloatBE(ay, 4);
        buf.writeFloatBE(az, 8);
        buf.writeFloatBE(mx,12);
        buf.writeFloatBE(my,16);
        buf.writeFloatBE(mz,20);
        buf.writeFloatBE(gx,24);
        buf.writeFloatBE(gy,28);
        buf.writeFloatBE(gz,32);
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
        const buf = Buffer.allocUnsafe(12);
        buf.writeFloatBE(Kp, 0);
        buf.writeFloatBE(Ki, 4);
        buf.writeFloatBE(Kd, 8);
        return buf;
        }
                
    this.Calibration = function()
        {
        const buf = Buffer.allocUnsafe(24)
        buf.writeFloatBE(gxo, 0)
        buf.writeFloatBE(gyo, 4)
        buf.writeFloatBE(gzo, 8)
        buf.writeFloatBE(mxo,12)
        buf.writeFloatBE(myo,16)
        buf.writeFloatBE(mzo,20)
        return buf
        }

    this.magnetoSave = function(buf)
        {
        console.log("Save magneto calibration")
        mxo = buf.readFloatBE(0)
        myo = buf.readFloatBE(4)
        mzo = buf.readFloatBE(8)
        store.set('mxo',mxo)
        store.set('myo',myo)
        store.set('mzo',mzo)
        }

    this.commande = function(value)
        {
        var fnc = Buffer.from(value).toString();
        switch (fnc)
                {
                case "kp-"         :    console.log("Kp -1");
                                        Kp -= 1;
                                        break;
                                
                case "kp+"         :    console.log("Kp +1");
                                        Kp += 1;
                                        break;
 
                case "ki-"         :    console.log("Ki -1");
                                        Ki -= 1;
                                        break;
                                
                case "ki+"         :    console.log("Ki +1");
                                        Ki += 1;
                                        break;
                                
                case "kd-"         :    console.log("Kd -1");
                                        Kd -= 1;
                                        break;
                                
                case "kd+"         :    console.log("Kd +1");
                                        Kd += 1;
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
							
                case 'pidSave'     :    console.log("Pid Save");
                                        store.set('kp',Kp)
                                        store.set('ki',Ki)
                                        store.set('kd',Kd)
                                        break

                case 'gyroSave'    :    console.log("Calibration Save Gyro")
                                        gxo = gxb
                                        gyo = gyb
                                        gzo = gzb
                                        store.set('gxo',gxo)
                                        store.set('gyo',gyo)
                                        store.set('gzo',gzo)
                                        break
                }
        }      
    }

