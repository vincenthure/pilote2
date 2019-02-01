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
        this.i_max     = 20

        const raspi = require('raspi')
        const pwm   = require('raspi-pwm');
        const gpio  = require('raspi-gpio')

        raspi.init(function(){ })
        this.pwm18  = new pwm.PWM('P1-12')
        this.gpio17 = new gpio.DigitalOutput('P1-11');
        }

    update(error)
        {
        this.sumError = this.sumError + (error*this.dt)
        if (Math.abs(this.sumError) > this.i_max) 
            {
            let sumSign = (this.sumError > 0) ? 1 : -1;
            this.sumError = sumSign * this.i_max;
            }
        let dError = (error - this.lastError)/this.dt
        this.lastError = error

        let output = (this.kp*error) + (this.ki * this.sumError) + (this.kd * dError)
        let reverse = (output>0)?1:0
        let val = Math.min(Math.abs(output/500),1)

        if (!isNaN(val)) 
            {
            this.pwm18.write(val)
            this.gpio17.write(reverse)
            } 

        return (reverse?val:-val)
       	} 

    get()
    	{
    	const buf = Buffer.allocUnsafe(12);
        buf.writeFloatBE(this.kp, 0);
        buf.writeFloatBE(this.ki, 4);
        buf.writeFloatBE(this.kd, 8);
        return buf;	
    	}

    set_kp(x)
    	{
    	console.log("Kp "+this.kp)
        this.kp += x 
        this.store.set('kp',this.kp)
    	}

    set_ki(x)
    	{
    	console.log("Ki "+x)
        this.ki += x 
        this.store.set('ki',this.ki)
    	}

    set_kd(x)
    	{
    	console.log("Kd "+x)
        this.kd += x 
        this.store.set('kd',this.kd)
    	}
    }

module.exports = Controller;