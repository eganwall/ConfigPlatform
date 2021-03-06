# Configuration Platform
Real-time configuration key-value store using Redis and JS.

#### Overview
Lately I've been getting into more Node.js development and have been writing some small, persistent services. I figured that it would be an interesting experiment to create a platform that I could leverage in order to edit the configuration of a service without having to stop, edit, and then restart. These services are running on a headless Raspberry Pi 2, so the convenience of a web-based, remote configuration solution saves me the trouble of SSH'ing into the Pi as well. I got to work and, after a couple of motivated nights, ended up with this codebase. 

The configuration setup is comprised of 3 parts: the configuration platform front-end, the configuration monitor, and the consumer applications. Redis is used for persistence and for publisher/subscriber functionality. 

#### Basic Flow
![Config Flow](http://i.imgur.com/l9GoTt7.png)

## The Components
#### The Configuration Platform
The configuration platform (configPlatform.js) is the main UI for the setup. It uses Bootstrap and Angular on the front-end, with a Node API on the back-end to enable the communication of the config state with Redis and consuming applications. On page load, the entire config state is retrieved from Redis and presented in a grid. When a config entry is added, edited, or deleted, the JSON object containing the entry's key, value, application name, and GUID is written to Redis, and then published on a master channel so that the configuration monitor service can update the LKGC file.

#### The Configuration Monitor
configMon.js is a Node.js service responsible for maintaining a local LKGC (last known good configuration) JSON file on the machine that any consuming services are running on. It subscribes to the master channel, and receives every added, updated, or deleted configuration entry. Upon receiving a message on its channel, it will write it to a local LKGC JSON file, which consuming applications will use as the single source of truth for their configuration. After updating the local file, the config monitor will publish another message to the _appname_ channel, where _appname_ is the application name specified in the configuration client. This will allow the service that cares about it to update its in-memory configuration in real time.

#### The Consuming Application
Because the configuration of each application is stored as JSON, any language or framework capable of opening a file and parsing JSON can leverage this functionality to a certain extent. Although Redis functionality is necessary for real-time configuration updates, it's fairly trivial to have an application re-load the LKGC file at 3- or 5-minute intervals in order to capture changes in configuration state. A consuming service will load the LKGC file at startup and store the entries that correspond to its own appname. It will also subscribe to the Redis channel corresponding to its appname, and any changes in config state will be published for the service to handle itself. Since the ConfigMon service will handle updating the local LKGC file, the consuming service only needs to update its internal configuration object that it populated with the LKGC's contents on startup. Basically, as long as the consumer maintains a Redis connection, the configuration can be updated in real-time from the web interface.
