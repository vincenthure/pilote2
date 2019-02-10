module.exports = function()
    {
    const STORE = require('data-store')
	const store = new STORE({ path: '/home/pi/pilote.json' })
	
	var gxo = store.get('gxo'),
    	gyo = store.get('gyo'),
    	gzo = store.get('gzo'),
		mxo = store.get('mxo'),
    	myo = store.get('myo'),
    	mzo = store.get('mzo')    

	if (typeof gxo === "undefined") gxo=0
	if (typeof gyo === "undefined") gyo=0
	if (typeof gzo === "undefined") gzo=0
	if (typeof mxo === "undefined") mxo=0
	if (typeof myo === "undefined") myo=0
	if (typeof mzo === "undefined") mzo=0

	this.update = function(capteur)
		{
		var val = { }

        val.ax = capteur.ax
        val.ay = capteur.ay
        val.az = capteur.az
        val.mx = capteur.mx - mxo
        val.my = capteur.my - myo
        val.mz = capteur.mz - mzo
        val.gx = capteur.gx - gxo
        val.gy = capteur.gy - gyo
        val.gz = capteur.gz - gzo
        return val
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

	this.gyroSave = function(capteur)
        {
		console.log("Calibration Save Gyro")
        gxo = capteur.gx
        gyo = capteur.gy
        gzo = capteur.gz
        store.set('gxo',gxo)
        store.set('gyo',gyo)
        store.set('gzo',gzo)
        }

    this.get = function()
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
	}
