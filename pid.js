module.exports = function()
    {
    const KP_INIT = 15
    const KI_INIT = 10
    const KD_INIT = 5

    const STORE = require('data-store')
	const store = new STORE({ path: '/home/pi/pilote.json' })
    
	var Kp = store.get('kp'),
    	Ki = store.get('ki'),
    	Kd = store.get('kd')
    
   	if (typeof Kp === "undefined")  Kp=KP_INIT
	if (typeof Ki === "undefined")  Ki=KI_INIT
	if (typeof Kd === "undefined")  Kd=KD_INIT

    const raspi = require('raspi')
    const pwm   = require('raspi-pwm');
    const gpio  = require('raspi-gpio')

    raspi.init(function(){ })
    const pwm18     = new pwm.PWM('P1-12')
    const gpio17    = new gpio.DigitalOutput('P1-11');

    var Vp,
		Vi=0,
		Vd,
		last_Vp,
		out

    this.update = function(Vp)
        {
        Vi     += Vp
        Vi      = Math.min(Vi, 1000/Ki)
        Vi      = Math.max(Vi,-1000/Ki)
        Vd      = Vp - last_Vp
        last_Vp = Vp

        out  = (Kp*Vp) + (Ki*Vi) + (Kd*Vd)
        var reverse = (out>0)?1:0
        var val = Math.min(Math.abs(out/1000),1)
 
        if (!isNaN(val)) 
            {
            pwm18.write(val)
            gpio17.write(reverse)
            } 

        return (reverse?val:-val)
       	}

    this.get = function()
    	{
    	const buf = Buffer.allocUnsafe(12);
        buf.writeFloatBE(Kp, 0);
        buf.writeFloatBE(Ki, 4);
        buf.writeFloatBE(Kd, 8);
        return buf;	
    	}

    this.kp = function(x)
    	{
    	console.log("Kp "+x)
    	Kp += x	
        store.set('kp',Kp)
    	}

    this.ki = function(x)
    	{
    	console.log("Ki "+x)
    	Ki += x
        store.set('ki',Ki)
    	}

    this.kd = function(x)
    	{
    	console.log("Kd "+x)
    	Kd += x
        store.set('kd',Kd)	
    	}
    }