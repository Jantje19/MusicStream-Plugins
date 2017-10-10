# Music Stream Plugin

## Install a plugin
- Download the repository
- Extract the .zip file in the /MusicStream/Plugins/ directory
- Run ```npm install``` in a CLI
- ???
- Profit

## Create a plugin
Take a look at the [example](https://github.com/Jantje19/MusicStream-Plugins/tree/master/Example). Or at the already created plugins: [Cast-Plugin](https://github.com/Jantje19/MusicStream-Cast-Plugin).

#### API
The *index.js* file looks on startup in the Plugins directory. It loops though every directory and searches for an *index.js* file. So **there should be an *index.js* file in the root of your plugin directory.**

##### Index.js
The *index.js* file can contain two objects:
- *clientJS*: This object requires:
	- *filePath*: The path of the file you want to manipulate (for example: '/Audio/index.html').
	- *script*: The script file you want to insert. This file has to be within the plugin directory.
- *server*: This function is used to create a request handler for the server. This object is a function that receives the following arguments:
	- *app*: This is the [Express](https://expressjs.com/) server handler. (See the example for more information).
	- *utils*: This is a reference to the utils object found in *index.js* with useful functions.
	- *path*: The directory of the plugin.

The script specified in *clientJS* can have a function ```loaded``` which will be executed on ```window.onload```

**More functionality coming soon**