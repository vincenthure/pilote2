const SERVICE_UUID     = 'ff10'
const CAP_UUID         = 'ff17'
const DATA_UUID        = 'ff18'
const PID_UUID         = 'ff19'
const CAPTEUR_UUID     = 'ff20'
const CALIBRATION_UUID = 'ff21'

var bleno = require('bleno');
var util  = require('util');
var Pilote = require('./pilote');

var BlenoCharacteristic = bleno.Characteristic;
var BlenoPrimaryService = bleno.PrimaryService;

//********************* Cap *******************************************************

var Cap = function() 
	{
	Data.super_.call(this, 
		{
		uuid: CAP_UUID,
		properties: ['read','write'],
		});
	};
	
util.inherits(Cap, BlenoCharacteristic);

Cap.prototype.onReadRequest = function(offset, callback) 
	{
    callback(this.RESULT_SUCCESS, new Buffer(Pilote.CapGet()));
    };

Cap.prototype.onWriteRequest = function(data, offset, withoutResponse, callback)
	{
	Pilote.CapSet(data)
    callback(this.RESULT_SUCCESS);
    };
    

//********************* data *******************************************************

var Data = function() 
	{
	Data.super_.call(this, 
		{
		uuid: DATA_UUID,
		properties: ['read'],
		});
	};
	
util.inherits(Data, BlenoCharacteristic);

Data.prototype.onReadRequest = function(offset, callback) 
	{
    callback(this.RESULT_SUCCESS, new Buffer(Pilote.Data()));
    };

//********************* capteur *******************************************************

var Capteur = function() 
	{
	Capteur.super_.call(this, 
		{
		uuid: CAPTEUR_UUID,
		properties: ['read']
		});
	};
	
util.inherits(Capteur, BlenoCharacteristic);

Capteur.prototype.onReadRequest = function(offset, callback) 
	{
    callback(this.RESULT_SUCCESS, new Buffer(Pilote.Capteur()));
    };
 
       
//********************* PID *******************************************************

var Pid = function() 
	{
	Pid.super_.call(this, 
		{
		uuid: PID_UUID,
		properties: ['read','write']
		});
	};
	
util.inherits(Pid, BlenoCharacteristic);

Pid.prototype.onReadRequest = function(offset, callback) 
	{
    callback(this.RESULT_SUCCESS, new Buffer(Pilote.Pid()));
    };

Pid.prototype.onWriteRequest = function(data, offset, withoutResponse, callback)
	{
	Pilote.PidSet(data)
    callback(this.RESULT_SUCCESS)
    };   

//********************* CALIBRATION *******************************************************

var Calibration = function() 
	{
	Calibration.super_.call(this, 
		{
		uuid: CALIBRATION_UUID,
		properties: ['read','write']
		});
	};
	
util.inherits(Calibration, BlenoCharacteristic);

Calibration.prototype.onReadRequest = function(offset, callback) 
	{
    callback(this.RESULT_SUCCESS, new Buffer(Pilote.Calibration()));
    };

Calibration.prototype.onWriteRequest = function(data, offset, withoutResponse, callback)
	{
	Pilote.CalibrationSave(data)
    callback(this.RESULT_SUCCESS)
    };   


//*************** create Service pilote ***************************************************

function piloteServices() 
	{
	piloteServices.super_.call(this, 
		{
		uuid: SERVICE_UUID,
		characteristics: 	[
							new Cap(),
							new Data(),
							new Pid(),
							new Capteur(),
							new Calibration()
							]
		});
	}

util.inherits(piloteServices, BlenoPrimaryService);

//*************** Advertise Service ***************************************************

bleno.on('stateChange', function(state)
		{
		if(state === 'poweredOn')
			{
			console.log("powered On");
			bleno.startAdvertising('CAP',[SERVICE_UUID]);	
			}
		else
			{
			bleno.stopAdvertising();
			}	
		});

//**************** Add Service ******************************************************

bleno.on('advertisingStart', function(err)
		{
		if(!err)
			{
			console.log("advertising Start");
			bleno.setServices([new piloteServices]);
			}
		});
	
