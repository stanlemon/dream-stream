# dreamforce
Demo code for Dreamforce 2015

1. Setup

    ```
    npm install
    ```

1. Starting up the websocket:

    ```
    node server
    ```

    This sets up a push console website and websocket (http and ws) on port 8082.

1. Accessing push console:

    ```
    localhost:8082
    ```

    Use your Salesforce instance URL for serverUrl and session ID for sessionId; both can be retrieved using a little VF and apex...