# Music Stream Plugin

## Install a plugin
- Download the repository
- Extract the .zip file in the /MusicStream/Plugins/ directory
- Run ```npm install``` in a CLI
- ???
- Profit

## Create a plugin
Take a look at the [example](https://github.com/Jantje19/MusicStream-Plugins/tree/master/Example).

#### API
The *index.js* file looks on startup in the Plugins directory. It loops though every directory and searches for an *index.js* file. So **there should be an *index.js* file in the root of your plugin directory.** This also means that **the name of your plugin is the name of the folder in the *Plugins* folder.**

##### Index.js
The *index.js* file can contain three objects:
- *clientJS*: Is used for adding JavaScript files to already created, *MusicStream* provided pages. This object requires:
	- *filePath*: The path of the file you want to manipulate (for example: '/Audio/index.html').
	- *script*: The script file you want to insert. This file has to be within the plugin directory.
- *server*: This function is used to create a request handler for the server. This object is a function that receives the following arguments:
	- *server*: A custom class with the argument functions *addGetRequest* and *addPostRequest*. They require objects, in an array or individually passed, with the following arguments:
		- *name*: The name of the request. Can be empty for \*.
		- *func*: A function that handles the request. It get passed the *response* and *request* attributes.
	- *imports*: Includes objects that are already required by the *MusicStream* service. They contain the following: *fs*, *os*, *id3*, *ytdl*, *utils*, *https*, *url*, *fileHandler* (*MusicStream* native), *querystring*.
	- *data*: Includes:
		- *version*: The *MusicStream* version.
		- *serverURL*: The URL on which *MusicStream* is currently hosted. Most of the times this is *172.0.0.1:8000*.
		- *path*: The absolute path of the plugin.
- *menu*: Creates an entry in the overflow menu on the main page. It requires the following arguments:
	- *url*: The url you want the button to go to on click. If empty the folder name is used.
	- *name*: The name of the button. If empty the folder name is used.

The script specified in *clientJS* can have a function ```loaded``` which will be executed on ```window.onload```

**The server POST and GET functions automaticly get the plugin name before it in the URL.** For example, the URL for a plugin, named *MyPlugin*, with a GET request specified as *home*, is *http://localhost:8000/MyPlugin/home.

**More functionality coming soon**
