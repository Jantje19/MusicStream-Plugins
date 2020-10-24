# Music Stream Plugin
This repository had the documentation for creating your own *MusicStream* plugin. It also stores plugins I've created.
*MusicStream* version 0.1.5 and above have support for plugins.
[If you don't know what *MusicStream* is, take a look here.](https://github.com/Jantje19/MusicStream/)

## Install a plugin
**Before installing any plugin you need to take a look at the source code and determine if it is safe to execute!**

#### Install a plugin
##### Automatic installation
If you are running [MusicStream version v0.2.6](https://github.com/Jantje19/MusicStream/releases/tag/v0.2.6) and above, you can install plugins by running `node plugins.js install [PLUGIN URL]` in a CLI in the *MusicStream* directory, where you should replace `[PLUGIN URL]` with the github repository link.\
If you are installing plugins from this repository you would run: `node plugins.js install https://github.com/jantje19/MusicStream-Plugins`.

##### Manual installation (from this repository)
1. Download this repository
2. Extract the .zip file
3. Look for the directory containing the desired plugin
4. Move/copy the whole folder in the *MusicStream/Plugins/* directory (If the directory doesn't exist, you have to create it)
5. (Re)start *MusicStream*

## Create your own plugin
Take a look at the [example](https://github.com/Jantje19/MusicStream-Plugins/tree/master/Example).

#### API
On startup the main *MusicStream* service looks in the *Plugins* directory. It loops though every directory and searches for an *index.js* file. So **there should be an *index.js* file in the root of your plugin directory.** This also means that **the name of your plugin is the name of the folder in the *Plugins* folder.**

##### Index.js
The *index.js* file can contain the following three objects:
- *clientJS*: Is used for adding JavaScript files to already created, *MusicStream* provided pages. It accepts an object or an array of objects. This object requires:
	- *filePath*: The path of the file you want to manipulate (for example: '/Audio/index.html').
	- *script*: The path of the script you want to insert. This file has to be within the plugin directory.
- *server*: This function is used to create a request handler for the server. This object is a function that receives the following arguments:
	- *server*: A custom class with the argument functions *addGetRequest* and *addPostRequest*. They require objects, in an array or individually passed, with the following arguments:
		- *name*: The name of the request. Can be empty for ```*```.
		- *func*: A function that handles the request. It get passed the *response* and *request* attributes.
	- *imports*: Includes objects that are already required by the *MusicStream* service. They contain the following: *fs*, *os*, *id3*, *ytdl*, *utils*, *https*, *url*, *fileHandler* (*MusicStream* native), *querystring*.
	- *data*: Includes:
		- *version*: The *MusicStream* version.
		- *serverURL*: The URL on which *MusicStream* is currently hosted. Most of the times this is *127.0.0.1:8000*.
		- *path*: The absolute path of the plugin.
- *menu*: Creates an entry in the overflow menu on the main page. This only works if you have the *server* object set. It requires the following arguments:
	- *url*: The url you want the button to go to on click. If empty, the folder name is used.
	- *name*: The name of the button. If empty the folder name is used.
- *hijackRequests*: Gives you the ability to edit & analyze requests and prevent requests from coming through.
	- *preventDefault (optional)*: Excepts a boolean. Specifies if the *next* function shouldn't be called directly after your function finishes.
	- *func*: The function that should be called when a request arrives. If you have *preventDefault* set to *true* you should call the *next* function. Receives the following arguments (in order):
		- *request*: The *express* request parameter.
		- *response*: The *express* response parameter.
		- *next*: A function that executes the next request handler. Only available when *preventDefault* is set to *true*.
		- *imports*: Includes objects that are already required by the *MusicStream* service. They contain the following: *fs*, *os*, *id3*, *ytdl*, *utils*, *https*, *url*, *fileHandler* (*MusicStream* native), *querystring*.
		- *data*: Includes:
			- *version*: The *MusicStream* version.
			- *serverURL*: The URL on which *MusicStream* is currently hosted. Most of the times this is *172.0.0.1:8000*.
			- *path*: The absolute path of the plugin.

##### The plugin can also be a function (module.exports = *function*)
A *MusicStream* plugin can export a function since v0.2.3.
The function gets two arguments: *data* & *imports*. These are same as the arguments passed to the *server* function listed above.

**The server POST and GET functions automatically get the plugin name before it in the URL.** For example, the URL for a plugin, named *MyPlugin*, with a GET request specified as *home*, is *http://localhost:8000/MyPlugin/home*.

#### Config file
If you want to write multiple plugins, but not overclutter your GitHub account, you can create one repository with a `msplugins.config.json` file. It is a json file containing the names and paths of the different plugins.\
For this repository it looks like this:
```JSON
{
	"Cast": "MyPlugins/Cast/",
	"Organize": "MyPlugins/Organize/",
	"SignIn": {
		"path": "MyPlugins/SignIn/",
		"npm-install": true
	}
}
```
