# Asciidoc to reveal.js online converter

This tool allows to launch a site that renders asciidoc documents to reveal.js slides using [asciidoctor-revealjs](https://asciidoctor.org/docs/asciidoctor-revealjs/) converter.

You can find a working example of this app on Heroku: https://asciidoc-revealjs-converter.herokuapp.com.

## Project usage and idea

This project allows you to store your presentations in `.adoc` format in some online storage (for example, on GitHub), and then render them to reveal.js presentations online on demand.

It also have a live-editor mode, which allows you to edit and preview your presentations online. 

## Project structure

`./index.ts` file is responsible for express backend. It can serve frontend files to the user, and also responsible for rendering `.adoc` into `.html` slides.

`./client/` folder contains a frontend React application, which consists of home page and live editor mode.

## Development

In order to launch the application locally, you need:

* Install frontend and backend projects' dependencies:

    ```sh
    $ npm install
    $ cd client && npm install && cd ..
    ```
* Compile and start backend application:

    ```sh
    npm run tsc && npm start
    ```

    If you update the code in `./index.ts`, you need to restart the server manually.
*  In the other console, start frontend application:

    ```sh
    cd client
    npm start
    ```

    This should automatically take you to http://localhost:5000, where you should see a working application.

    If you change `./client/` code, the application will update automatically.
