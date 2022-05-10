require ('dotenv').config ();

const Express = require ('express');
const File_System = require ('fs');
const HTTP_Server = require ('http');
const {ReadlineParser} = require ('@serialport/parser-readline');
const {SerialPort} = require ('serialport');
const Web_Socket = require ('ws');

const Application = Express ();
const Data_Parser = new SerialPort ({baudRate: 9600, path: 'COM4'}).pipe (new ReadlineParser ({delimiter: '\r\n'}));
const Web_Socket_Server = new Web_Socket.Server ({port: process.env.Web_Socket_Server_Port_Number});

Application.use (Express.static (__dirname));

let Results = JSON.parse (File_System.readFileSync ('Database/Results.json'));
let Statistics = JSON.parse (File_System.readFileSync ('Database/Statistics.json'));

const Game_Number = Results.length;

Web_Socket_Server.on ('connection', Web_Socket => 
{
	Data_Parser.on ('data', Data => 
	{
		Web_Socket.send (Data.toString ());
		if (!Results [Game_Number]) 
		{
			Results.push ([]);
		}
		if (Results [Game_Number].length < 10) 
		{
			Results[Game_Number].push (JSON.parse (Data.toString ()));
			File_System.writeFileSync ('Results.json', JSON.stringify (Results));
		}
		else if (Results [Game_Number].length == 10)
		{
			let Average_time_taken_to_press_the_sensor, Average_times_taken_to_press_the_sensor = new Array (5), Maximum_average_time_taken_to_press_the_sensor = 0, Minimum_average_time_taken_to_press_the_sensor, Number_of_times_the_sensor_was_pressed = 0, Strength_Indicator = 0, Weakness_Indicator = 0;
			Average_times_taken_to_press_the_sensor.forEach ((Time, Index) => 
			{
				Average_time_taken_to_press_the_sensor = 0;
				Results [Game_Number].forEach (Result =>	
				{
					if (Result ['Touch Sensor Number'] == Index) 
					{
						Average_time_taken_to_press_the_sensor = Average_time_taken_to_press_the_sensor + Result ['Time taken to press the sensor'];
						Number_of_times_the_sensor_was_pressed = Number_of_times_the_sensor_was_pressed + 1;
					}
				});
				Time = Average_time_taken_to_press_the_sensor / Number_of_times_the_sensor_was_pressed;
			});
			Minimum_average_time_taken_to_press_the_sensor = Average_times_taken_to_press_the_sensor [0];
			Average_times_taken_to_press_the_sensor.forEach ((Time, Index) => 
			{
				if (Time > Maximum_average_time_taken_to_press_the_sensor) 
				{
					Maximum_average_time_taken_to_press_the_sensor = Time;
					Weakness_Indicator = Index;
				}
				if (Time < Minimum_average_time_taken_to_press_the_sensor) 
				{
					Minimum_average_time_taken_to_press_the_sensor = Time;
					Strength_Indicator = Index;
				}
			});
			Statistics.push ({'Average times taken to press the sensor': Average_times_taken_to_press_the_sensor, 'Weakness Indicator': Weakness_Indicator,'Strength Indicator': Strength_Indicator});
			File_System.writeFileSync ('Statistics.json', JSON.stringify (Statistics));
		} 
		else 
		{
			const Times_Taken_to_Solve_an_Equation = JSON.parse (Data.toString());
			Statistics [Game_Number] ['Times taken to solve an equation'] = Times_Taken_to_Solve_an_Equation;
			Statistics [Game_Number] ['Average time taken to solve an equaation'] = Times_Taken_to_Solve_an_Equation.length != 0 ? (Times_Taken_to_Solve_an_Equation.reduce((Previous_Time, Current_Time) => Current_Time = Current_Time + Previous_Time) / Times_Taken_to_Solve_an_Equation.length) : 0;
			File_System.writeFileSync ('Statistics.json', JSON.stringify (Statistics));
		}
	});
});

Application.get ('/get-current-training-session-number', (Request, Response) => Response.json ({'Current Training Session Number': Results.length}));
Application.get ('/get-results', (Request, Response) => Response.json (Results));
Application.get ('/get-statistics', (Request, Response) => Response.json (Statistics));

HTTP_Server.createServer (Application).listen (process.env.Server_Port_Number);

/*
const Audio_Recorder_Options = 
{
	program: `rec`, // Which program to use, either `arecord`, `rec`, or `sox`.
	device: 'plughw:1,0', // Recording device to use, e.g. `hw:1,0`
	bits: 16, // Sample size. (only for `rec` and `sox`)
	channels: 1, // Channel count.
	encoding: `signed-integer`, // Encoding type. (only for `rec` and `sox`)
	//format: `S16_LE`,   // Encoding type. (only for `arecord`)
	rate: 16000, // Sample rate.
	type: `wav`, // Format type.
	// Following options only available when using `rec` or `sox`.
	silence: 2, // Duration of silence in seconds before it stops recording.
	thresholdStart: 0.5, // Silence threshold to start recording.
	thresholdStop: 0.5, // Silence threshold to stop recording.
	keepSilence: true // Keep the silence in the recording.
};

const Audio_Recorder = new Node_Audio_Recorder (Audio_Recorder_Options);
const IBM_Cloud_Speech_to_Text_Service = require ('ibm-watson/speech-to-text/v1');
const {IamAuthenticator} = require ('ibm-watson/auth');
const Node_Audio_Recorder = require ('node-audiorecorder');
const Path = require ('path');

const Audio_File_Name = Path.join (__dirname, Math.random ().toString (36).replace (/[^a-z]+/g, '').concat('.wav'));
Audio_Recorder.start ().stream ().pipe (File_System.createWriteStream (Audio_File_Name, {encoding: 'binary'}));

Audio_Recorder.stream ().on ('end', () =>
{
	const Speech_to_Text = new IBM_Cloud_Speech_to_Text_Service ({authenticator: new IamAuthenticator ({apikey: process.envIBM_Cloud_API_Key}), url: process.env.IBM_Cloud_Speech_to_Text_API_URL});
	Speech_to_Text.recognize ({audio: File_System.createReadStream (Audio_File_Name), contentType: 'audio/wav', model: 'en-US_NarrowbandModel'})
});

setTimeout (() => Audio_Recorder.stop (), 5000)
*/