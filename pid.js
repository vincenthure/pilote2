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
        this.i_max     = 50
        this.cap       = 0
        this.error     = 0
        this.output    = 0

        const raspi = require('raspi')
        const pwm   = require('raspi-pwm');
        const gpio  = require('raspi-gpio')

        raspi.init(function(){ })
        this.pwm18  = new pwm.PWM('P1-12')
        this.gpio17 = new gpio.DigitalOutput('P1-11');
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

    set_cap_to_heading(heading)
        {
        this.cap = heading
        if(this.cap<0)    this.cap +=360
        if(this.cap>359)  this.cap -=360
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
        if(heading<0)    heading +=360

        this.error = heading - this.cap
        if( this.error >  180 ) this.error -= 360
        if( this.error < -180 ) this.error += 360
          
        this.sumError = this.sumError + (this.error*this.dt)
        if (Math.abs(this.sumError) > this.i_max) 
            {
            let sumSign = (this.sumError > 0) ? 1 : -1;
            this.sumError = sumSign * this.i_max;
            }
        let dError = (this.error - this.lastError)/this.dt
        this.lastError = this.error

        this.output = ((this.kp * this.error) + (this.ki * this.sumError) + (this.kd * dError))/500
        let reverse = (this.output>0)?1:0
        let val = Math.min(Math.abs(this.output),1)

        if (!isNaN(val)) 
            {
            this.pwm18.write(val)
            this.gpio17.write(reverse)
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