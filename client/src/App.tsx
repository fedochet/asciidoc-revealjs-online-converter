import { BrowserRouter as Router, Link, Route, Switch } from 'react-router-dom';
import React from 'react';
import './App.css';
import Editor from '@monaco-editor/react';
import monaco from 'monaco-editor';
import { debounce } from 'lodash';


function App() {
  return (
    <Router>
      <Switch>
        <Route path="/live">
          <Live />
        </Route>
        <Route path="/">
          <Home />
        </Route>
      </Switch>
    </Router>
  );
}

function Home() {
  return (
    <div className="App">
      <h1>Asciidoc-Revealjs Converter</h1>

      <p>This tool allows you to convert your asciidoc documents to reveal.js slides online!</p>

      <form action="render">
          <p>
              <label htmlFor="url"><b>Enter the link to your document to the form below:</b></label>
          </p>
          <input type="url" name="url" placeholder="Raw github reference"></input>
          <button formAction="render">Render slides</button>
          <button formAction="render" name="print-pdf">Render PDF</button>
      </form>

      <p>Or you can use <Link to="/live">online editor mode</Link>.</p>
    </div>
  );
}

function Live() {
  return (
    <div>
      <h1>Asciidoc-Revealjs Converter Online editor</h1>
      <div style={{display: "flex"}}>
          <div id="container" style={{flex: "50%", height: "600px", border: "1px solid grey", overflow: "hidden"}}>
            <Editor
              language='asciidoc'
              value={SAMPLE_SLIDES_TEXT}
              editorDidMount={setupEditor}
              options={{
                wordWrap: "off"
              }}
            />
          </div>
          <iframe id="rendered-slides-iframe" title="rendered-slides-iframe" style={{flex: "50%"}} src=""></iframe>
      </div>
    </div>
  );
}

export default App;

function setupEditor(_: any, editor: monaco.editor.ICodeEditor) {
  function fetchAndRenderSlides() {
    renderSlidesToIframe(editor.getValue());
  }

  // Render current slides for the first time
  fetchAndRenderSlides();

  editor.onDidChangeModelContent(debounce(fetchAndRenderSlides, RENDER_SLIDES_AFTER_CHANGES_TIMEOUT));
}

const SAMPLE_SLIDES_TEXT = [
  '= Title slide',
  '',
  '== Second slide',
  '',
  'Some text'
].join('\n');

const RENDER_SLIDES_AFTER_CHANGES_TIMEOUT = 1000;
const SLIDE_ANCHOR_SEPARATOR = "#/";

function extractCurrentSlideAnchor(url: any) {
  var poundIdx = url.lastIndexOf(SLIDE_ANCHOR_SEPARATOR);
  if (poundIdx === -1) {
      return "";
  }

  return url.substring(poundIdx + 2);
}

function getRenderedSlidesIframe(document: any) {
  return document.querySelector("#rendered-slides-iframe");
}

function saveSlidesToServer(slidesSourceCode: any, callback: any) {
  fetch("save", { 
      method: "POST", 
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: slidesSourceCode }) 
  }).then((response) => response.text().then(callback));
}

function renderSlidesToIframe(slidesSourceCode: any) {
  var slidesFrame = getRenderedSlidesIframe(document);
  var currentSlidesAddress = slidesFrame.contentWindow.location.href;
  var currentSlideAnchor = extractCurrentSlideAnchor(currentSlidesAddress);

  saveSlidesToServer(slidesSourceCode, (saved_slides_id: any) => {
      var newSlidesAddress = "/render?slides_id=" + saved_slides_id;

      slidesFrame.src = newSlidesAddress + SLIDE_ANCHOR_SEPARATOR + currentSlideAnchor;
  })
}
