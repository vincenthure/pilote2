module.exports = function()
    {
    const async   = require("async")
    const i2c     = require("i2c-bus")

    const FXOS8700          = 31  // magnetometre , accelerometre
    const MAG_WHO_I_AM      = 13
    const MAG_XYZ_DATA_CFG  = 14
    const MAG_CTRL_REG1     = 42
    const MAG_CTRL_REG2     = 43
    const MAG_MCTRL_REG1    = 91
    const MAG_MCTRL_REG2    = 92
    const MAG_SENSITIVITY   = 0.000244    //  2G

    const FXAS210002        = 33  // gyroscope
    const GYRO_WHO_I_AM     = 12
    const GYRO_REG0         = 13
    const GYRO_REG1         = 19
    const GYRO_SENSITIVITY  = 0.00027270  //  500DPS

    const DATA              = 1

    const i2c1  = i2c.openSync(1)
    const buff1 = new Buffer(12)
    const buff2 = new Buffer(6)

    i2c1.writeByteSync(FXOS8700,   MAG_CTRL_REG1,    0x00);
    i2c1.writeByteSync(FXOS8700,   MAG_XYZ_DATA_CFG, 0x00);
    i2c1.writeByteSync(FXOS8700,   MAG_CTRL_REG2,    0x02);
    i2c1.writeByteSync(FXOS8700,   MAG_CTRL_REG1,    0x15);
    i2c1.writeByteSync(FXOS8700,   MAG_MCTRL_REG1,   0x1F);
    i2c1.writeByteSync(FXOS8700,   MAG_MCTRL_REG2,   0x20);

    i2c1.writeByteSync(FXAS210002, GYRO_REG1,    0x00);
    i2c1.writeByteSync(FXAS210002, GYRO_REG0,    0x02);
    i2c1.writeByteSync(FXAS210002, GYRO_REG1,    0x0E);

    this.get = function(capteur)
        {
        var x,y,z;

        async.parallel
            (
            [
            function(cb) { i2c1.readI2cBlock(FXOS8700,   DATA, 12, buff1, cb); },
            function(cb) { i2c1.readI2cBlock(FXAS210002, DATA, 6,  buff2, cb); }
            ],

            function(err, results) 
                {

   //****************  ACCELEROMETRE *****************

                x = ((buff1[0] << 8) | buff1[1])>>2
                y = ((buff1[2] << 8) | buff1[3])>>2
                z = ((buff1[4] << 8) | buff1[5])>>2

                if(x > 0x1FFF)  x -= 0x3FFF
                if(y > 0x1FFF)  y -= 0x3FFF
                if(z > 0x1FFF)  z -= 0x3FFF

                capteur.ax = x*MAG_SENSITIVITY
                capteur.ay = y*MAG_SENSITIVITY
                capteur.az = z*MAG_SENSITIVITY

   //***************** MAGNETOMETRE *******************
                
                x = ((buff1[6]  << 8) | buff1[7])
                y = ((buff1[8]  << 8) | buff1[9])
                z = ((buff1[10] << 8) | buff1[11])

                if(x > 0x7FFF)  x -= 0xFFFF
                if(y > 0x7FFF)  y -= 0xFFFF
                if(z > 0x7FFF)  z -= 0xFFFF
                
                capteur.mx = x
                capteur.my = y
                capteur.mz = z
                
   //******************* GYRO ******************
            
                x = ((buff2[0] << 8) | buff2[1])
                y = ((buff2[2] << 8) | buff2[3])
                z = ((buff2[4] << 8) | buff2[5])

                if(x > 0x3FFF)  x -= 0xFFFF
                if(y > 0x3FFF)  y -= 0xFFFF
                if(z > 0x3FFF)  z -= 0xFFFF
                
                capteur.gx = x*GYRO_SENSITIVITY
                capteur.gy = y*GYRO_SENSITIVITY
                capteur.gz = z*GYRO_SENSITIVITY
                }
        )
        }
    }
