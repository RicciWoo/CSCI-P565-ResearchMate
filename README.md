<h1>CSCI-P565-ResearchMate</h1>
<strong>This is a group project for the coursework CSCI-P 565 Software Engineering.</strong>

<h1>System Requirements</h1> 

<h2>Server:</h2>
For running and maintaining server, a system with following functionalities is required
<h3>Node.js (v6.11.3):</h3>
Node.js is a set of libraries for JavaScript which allows it to be used outside of the browser. It is primarily focused on creating simple, easy to build network clients and servers.
<h3>mongod(v2.6.12):</h3>
mongod is the primary daemon process for the MongoDB system. It handles data requests, manages data format, and performs background management operations.
<h3>mongo(v2.6.12):</h3>
mongo is an interactive JavaScript shell interface to MongoDB, which provides a powerful interface for systems administrators as well as a way for developers to test queries and operations directly with the database. mongo also provides a fully functional JavaScript environment for use with a MongoDB.

<h2>User-Interface:</h2>
The UI is accessible from most of the updated versions of popular browsers.
<ul>
	<li>Chrome: 62.0.3202.94 and above</li>
	<li>Firefox: 38.0.1 and above</li>
	<li>Internet Explorer: IE10 and above</li>
</ul>

<h2>Support for server application:</h2>
There are several modules provided for node by some third parties which are essential for running servers.<br>
All are included in package.json file along with their version numbers.
<h3>Platform:</h3>
There is no specific platform which is required for running the server as long as the requirements specified above are satisfied.<br> 
Nonetheless for maintenance and debugging, a Linux system with any distribution can be used.<br>
(For development and debugging, developers used Ubuntu 16.04 LTS.)
 
 
<h1>Product Installation</h1> 
 
<h2>Product installation requires the system to have following packages:</h2>
<h3>npm package manager:</h3>
This is a tool which helps keep track of various node modules. A detailed explanation and installation guide is available at: <a href="https://github.com/npm/npm" >NPM</a>
 
<h2>Installation can be done by following basic steps given below:</h2>

<ol>

<h3><li>Run a mongod daemon with following command:</li></h3>

<b>Silo:</b> "numactl --interleave=all mongod -- dbpath /u/(username)/(path)/ --port (port #)"<br>
<ul>
    <li>(username) - username of the installer / admin</li>
    <li>(path) - the location where you want store data related to ResearchMate</li>
    <li>(port #) - the port number with which you want to run this instance of mongod</li>
</ul>        <br>

<b>local system:</b> sudo mongod --dbpath (path) --port (port #)<br>
<ul>
    <li>(path) - the location where you want store data related to ResearchMate</li>
    <li>(port #) - the port number with which you want to run this instance of mongod</li>
</ul>			<br>

<h3><li>Open /backend/server.js file and change line 3: "var portNumber = (port #);".</li></h3>
<ul>
    <li>(port #) - the port number where you want to run the server</li>
    <li>By default, this port number is set to "54545".</li>
</ul>


<h3><li>Open /backend/server.js file and change line 66:</h3> 
<strong>"var connection = mongoose.connect('mongodb://(location):(port#)/(dbname)', { useMongoClient: true });"</li></strong><br>
<ul>
       <li>(location) - the location where you are running mongod instance</li>
           For silo: (location) = "silo.soic.indiana.edu" <br>
           For local system: (location) = "localhost" <br>
       <li>(port#) - the port number set in step 1.</li>
</ul>

<h3><li>Change working directory to /backend and run command: "npm install".</li></h3>
    Successful execution of the above command gathers all the required node modules.


<h3><li>Change working directory to /backend and run command: "node server.js".</li></h3>
    Successful executing of this command starts the server application and shows:<br>
        "Server running at silo.soic.indiana.edu: (port #)" <br>
            which means, the server is running at port number set in step 2.<br>


<h3><li>Successful execution of steps 1 to 5 starts the server.</li></h3> 
<strong>ResearchMate can be accessed at:</strong>
<ul>
    <li>If run on local system: <a href="http://localhost:54545" >"http://localhost:54545"</a></li>
    <li>If run on silo: <a href="http://silo.soic.indiana.edu:54545">"http://silo.soic.indiana.edu:54545"</a></li>
</ul>
</ol>
