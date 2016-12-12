# WSO2 Tooling Desktop Application

This is an [Electron](https://github.com/electron/electron) application. It packages 
both web application modules and backend services into a single distribution for 
running on desktop.

## How to Run:

Please follow the below steps for running this application on your local machine:

- Install Node.js via a package manager by following [this](https://nodejs.org/en/download/package-manager/) 
installation guide. It would install both Node.js runtime and node package manager (npm).

- Install Electron as a node package, by executing following npm command:
    ```
    npm install electron
    ```

- Once Electron is installed, execute the below command to start the WSO2 Tooling application:

    ```
    electron main.js
    ```

## How to Build the Distribution:

Need to add a mechanism for creating the binary distribution.