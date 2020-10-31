import { BrowserRouter as Router, Link, Route, Switch } from 'react-router-dom';
import React, { createRef } from 'react';
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

      <RenderForm />

      <p>Or you can use <Link to="/live">online editor mode</Link>.</p>
    </div>
  );
}

interface RenderFormElement extends HTMLFormElement {
  readonly url: HTMLInputElement;
  readonly separateFragments: HTMLInputElement;
}

interface RenderFormSubmitEvent extends Event {
  readonly submitter: HTMLButtonElement;
  readonly target: RenderFormElement;
}

function RenderForm() {
  const RENDER_SLIDES = "renderSlides";
  const RENDER_PDF = "renderPdf";

  const handleSubmit = (e: RenderFormSubmitEvent) => {
    e.preventDefault();

    const slidesUrl = e.target.url.value;
    const separateFragments = e.target.separateFragments.checked;

    const printPdfOtption = e.submitter.value == RENDER_PDF ? "print-pdf&" : "";

    window.location.href = `./render?pdfSeparateFragments=${separateFragments}&${printPdfOtption}url=${slidesUrl}`;
  };

  const passNativeEvent = (event: React.FormEvent<HTMLFormElement>) => {
    handleSubmit(event.nativeEvent as RenderFormSubmitEvent);
  }

  return (
    <form onSubmit={passNativeEvent}>
      <label htmlFor="url"><b>Enter the link to your document to the form below:</b></label>
      <br/>
      <br/>
      <input 
        type="url" 
        name="url"
        placeholder="Raw github reference"
        />
      <br/>
      <button type="submit" value={RENDER_SLIDES}>Render slides</button>
      <br/>
      <button type="submit" value={RENDER_PDF}>Render PDF</button>
      <input
        type="checkbox"
        name="separateFragments"
        defaultChecked={false}
        />
      Separate fragments to different slides
    </form>
  );
}

function Live() {
  return (
    <div>
      <h1>Asciidoc-Revealjs Converter Online editor</h1>
      <LiveEditingEditorComponent/>
    </div>
  );
}

class LiveEditingEditorComponent extends React.Component {
  private slidesIframeRef = createRef<HTMLIFrameElement>();

  render() {
    return (
      <div style={{display: "flex"}}>
        
        <div id="container" style={{flex: "50%", height: "600px", border: "1px solid grey", overflow: "hidden"}}>
          <Editor
            language='asciidoc'
            value={SAMPLE_SLIDES_TEXT}
            editorDidMount={(_, editor) => this.setupEditor(editor)}
            options={{
              wordWrap: "off"
            }}
          />
        </div>

        <iframe ref={this.slidesIframeRef} title="rendered-slides-iframe" style={{flex: "50%"}} src=""></iframe>
      
      </div>
    );
  }

  private setupEditor(editor: monaco.editor.ICodeEditor) {  
    // Render current slides for the first time
    this.fetchAndRenderSlides(editor);
  
    editor.onDidChangeModelContent(debounce(() => this.fetchAndRenderSlides(editor), RENDER_SLIDES_AFTER_CHANGES_TIMEOUT));
  }  

  private fetchAndRenderSlides(editor: monaco.editor.ICodeEditor) {
    const slidesIframe = this.slidesIframeRef.current;
    
    if (slidesIframe) {
      renderSlidesToIframe(slidesIframe, editor.getValue());
    }
  }
}

export default App;

const SAMPLE_SLIDES_TEXT = [
  '= Title slide',
  '',
  '== Second slide',
  '',
  'Some text'
].join('\n');

const RENDER_SLIDES_AFTER_CHANGES_TIMEOUT = 1000;
const SLIDE_ANCHOR_SEPARATOR = "#/";

function extractCurrentSlideAnchor(url: string): string {
  const poundIdx = url.lastIndexOf(SLIDE_ANCHOR_SEPARATOR);
  if (poundIdx === -1) {
      return "";
  }

  return url.substring(poundIdx + 2);
}

async function saveSlidesToServer(slidesSourceCode: string): Promise<string> {
  return fetch("save", { 
      method: "POST", 
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: slidesSourceCode }) 
  }).then((response) => response.text());
}

async function renderSlidesToIframe(slidesFrame: HTMLIFrameElement, slidesSourceCode: string) {
  const currentSlidesAddress = slidesFrame.contentWindow!.location.href;
  const currentSlideAnchor = extractCurrentSlideAnchor(currentSlidesAddress);

  const savedSlidesId = await saveSlidesToServer(slidesSourceCode);

  const newSlidesAddress = `/render?slides_id=${savedSlidesId}`;
  slidesFrame.src = newSlidesAddress + SLIDE_ANCHOR_SEPARATOR + currentSlideAnchor;
}
