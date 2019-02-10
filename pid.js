"use strict";

class Controller
    {
    constructor(dt) 
        {
        const KP_INIT = 15
        const KI_INIT = 10
        const KD_INIT = 5

        const STORE = require('data-store')
        this.store = new STORE({ path: '/home/pi/pilote.json' })
    
        this.kp = this.store.get('kp'),
        this.ki = this.store.get('ki'),
        this.kd = this.store.get('kd')
    
        if (typeof this.kp === "undefined")  this.kp=KP_INIT
        if (typeof this.ki === "undefined")  this.ki=KI_INIT
        if (typeof this.kd === "undefined")  this.kd=KD_INIT

        this.dt        = dt/1000 
        this.sumError  = 0
        this.lastError = 0
        this.lastTime  = 0
        this.i_max     = 15
        this.cap       = 0
        this.heading   = 0
        this.error     = 0
        this.output    = 0
        this.stanby    = false

        const raspi = require('raspi')
        const pwm   = require('raspi-pwm');
        const gpio  = require('raspi-gpio')

        raspi.init(function(){ })
        this.pwm18  = new pwm.PWM('P1-12')     // pin18 pwm
        this.gpio17 = new gpio.DigitalOutput('P1-11'); // pin 17 fonction reverse
        }
        
    change_stanby()
        {        
        this.stanby = !this.stanby
        console.log(this.stanby)
        }   

    get_stanby(val)
        {        
        return(this.stanby)
        }   

    set_cap(val)
        {
        this.cap += val
        if(this.cap<0)    this.cap +=360
        if(this.cap>359)  this.cap -=360
        }

    get_cap(val)
        {        
        return(this.cap)
        }

	get_heading(val)
        {        
        return(this.heading)
        }

   set_cap_to_heading(heading)
        {
        this.cap = this.heading
        }

    get_error()
        {
        return(this.error)    
        }

    get_output()
        {
        return(this.output)    
        }

    update(heading)
        {
		heading *= -57.29577951308233
        if(heading<0)    heading +=360
		this.heading = heading
		
        this.error = this.heading - this.cap
        if( this.error >  180 ) this.error -= 360
        if( this.error < -180 ) this.error += 360
         
        let vp =  this.kp * this.error

        this.sumError = this.sumError + this.error*this.dt
        if ( Math.abs(this.sumError) > this.i_max) 
            {
            let sumSign = (this.sumError > 0) ? 1 : -1;
            this.sumError = sumSign * this.i_max;
            }
        let vi = this.ki * this.sumError 

        let dError = (this.error - this.lastError)/this.dt
        this.lastError = this.error
        let vd =  this.kd * dError

        this.output = (vp+vi+vd)/200
        let reverse = (this.output>0)?1:0
        let val = Math.min(Math.abs(this.output),1)

        if(this.stanby == false)
			{
				console.log("send")
			if (!isNaN(val)) 
				{
				this.pwm18.write(val)
				this.gpio17.write(reverse)
				} 
            } 
       	} 

    get_Kpid()
    	{
    	const buf = Buffer.allocUnsafe(12);
        buf.writeFloatBE(this.kp, 0);
        buf.writeFloatBE(this.ki, 4);
        buf.writeFloatBE(this.kd, 8);
        return buf;	
    	}

    set_kp(x)
    	{
        this.kp += x
        if(this.kp<0) this.kp=0
        this.store.set('kp',this.kp)
        console.log("Kp "+this.kp)
    	}

    set_ki(x)
    	{
        this.ki += x 
        if(this.ki<0) this.ki=0
        this.store.set('ki',this.ki)
        console.log("Ki "+x)
    	}

    set_kd(x)
    	{
        this.kd += x 
        if(this.kd<0) this.kd=0
        this.store.set('kd',this.kd)
        console.log("Kd "+x)
     	}
    }

module.exports = Controller;
