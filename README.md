# The Dream Stream
The Dream Stream is a real time event stream that integrates with a Salesforce instance.  It was built to be deployed on Heroku and was used during the  "Integrating High-Velocity External Data in Your Salesforce Application" at Dreamforce 2015.

Setup Locally
====================

1. Install dependencies

    ```
    npm install
    ```

1. Starting up the websocket:

    ```
    node server
    ```

1. Accessing push console:

    ```
    open http://localhost:8082
    ```


Running in Salesforce Org and Using Heroku
====================

1. Login to Heroku
    ```
    heroku login
    ```

1. Create an application on Heroku
    ```
    heroku create
    ```

1. Add a Postgres database to your application
    ```
    heroku addons:create heroku-postgresql
    ```

1. Add Heroku Connect to your application
    ```
    heroku addons:create herokuconnect
    ```

1. Open Heroku Connect to finish configuring it, this is where you will Oauth with Salesforce
    ```
    heroku addons:open herokuconnect
    ```

1. Do a git push of the application, deploying it to Heroku
    ```
    git push heroku master
    ```

1. Open the application so that you can access the console
    ```
    heroku open
    ```

Sending Events to the Application
===================

Use your Salesforce instance URL for serverUrl and session ID for sessionId; both can be retrieved out of the developer console.

1. Creating a tracked event using curl
    ```
    curl "https://localhost:8082/send?message=%7B\"event\":\"Viewed%20a%20webpage\",\"email\":\"bertha@fcof.net\"%7D"
    ```

1. Witness the event in real time on the stream, and prosper!


Seeing Events in Salesforce
=================
There are two visualforce pages included in this repository that you will need to add to your Salesforce instance.  You will also need to change instances of the demo dream stream Heroku URL to whatever URL you saw when you ran heroku open. From there open the DreamStreamWrapper page in your instance and you will be able to see events flow into your salesforce instance.

