/**
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
const electron = require('electron'),
		app = electron.app,
		BrowserWindow = electron.BrowserWindow,
		path = require('path'),
		fs = require('fs'),
		appDir = app.getAppPath(),
		Log = require('log'),
		Menu = electron.Menu;

var logger = new Log('info'),
 	logsDir = appDir + path.sep + ".." + path.sep + ".." + path.sep + "logs",
	pageURL = "file:" + appDir + "/modules/sequence-diagram-editor/index.html",
	serviceProcess,
	mainWindow;

function createLogger(){
	if (!fs.existsSync(logsDir)){
		fs.mkdirSync(logsDir);
	}
	fs.access(logsDir, fs.W_OK, function(err) {
		if(err){
			logger.error("can't write to log folder.");
		}
		else{
			logger = new Log('info', fs.createWriteStream(logsDir + path.sep + "app.log"));
		}
	});
}

function createService(){

	var logsDirSysProp = "-DlogsDirectory=" + logsDir;

	var log4jConfPath = appDir + path.sep + "conf" + path.sep + "log4j.properties";
	var log4jConfProp = "-Dlog4j.configuration=" + "file:" + log4jConfPath;
	var debugArgs="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=6006";

	const spawn = require('child_process').spawn;
	serviceProcess = spawn('java', [log4jConfProp, logsDirSysProp, '-jar', appDir + path.sep + "services" + path.sep + "workspace-service.jar"]);

	serviceProcess.stdout.on('data', function(data){
		logger.info('Service info: ' + data);
	});

	serviceProcess.stderr.on('data', function(data){
		logger.error('Service error: ' + data);
	});

	serviceProcess.on('close', function(code){
		logger.debug('Service closed: ' + code);
	});
}

function createWindow () {
	// Create the browser window
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		minWidth: 1200,
		minHeight: 800
	});

	// Load the index.html of the application
	mainWindow.loadURL(pageURL);

	// Open the DevTools
	//mainWindow.webContents.openDevTools()

	// Emitted when the window is closed
	mainWindow.on('closed', function () {
		// Dereference the window object, usually you would store windows
    	// in an array if your app supports multi windows, this is the time
    	// when you should delete the corresponding element.
		mainWindow = null;
	});

	// Create the Application's main menu
	var template = [{
		label: "WSO2 Tooling",
		submenu: [
			{ label: "About WSO2 Integration Server Tool", selector: "orderFrontStandardAboutPanel:" },
			{ type: "separator" },
			{ label: "Quit", accelerator: "Command+Q", click: function() {
				serviceProcess.kill();
				app.quit(); }}
		]}, {
		label: "Edit",
		submenu: [
			{ label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
			{ label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
			{ label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
			{ label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
		]}
	];

	Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// This method will be called when Electron has finished initialization and is 
// ready to create browser windows. Some APIs can only be used after this event occurs.
app.on('ready', function(){
	createLogger();
	createService();
	createWindow();
});

// Quit application when all windows are closed.
app.on('window-all-closed', function () {
	// On macOS it is common for applications and their menu bar
  	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit()
	}
	// kill the service child process
	serviceProcess.kill();
});

app.on('activate', function () {
	// On macOS it's common to re-create a window in the app when the
  	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow()
	}
});
