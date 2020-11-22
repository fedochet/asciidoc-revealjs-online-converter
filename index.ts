import express from 'express';
import bodyParser from 'body-parser';
import wrap from 'express-async-wrap';
import request from 'request-promise';
import dotenv from 'dotenv';
import path from 'path';
import shajs from 'sha.js';

dotenv.config();

const asciidoctor = require('@asciidoctor/core')();
import asciidoctorRevealjs from '@asciidoctor/reveal.js';
asciidoctorRevealjs.register();

const PORT = process.env.PORT || 5000;

express()
  .use(bodyParser.json())
  // Serve frontend static files
  .use(express.static(path.join(__dirname, '../client/build')))
  .get('/render', wrap(handle_render_slides))
  .post('/render', wrap(handle_render_slides_post))
  // Render built react application in production
  .get('*', (_, res) => res.sendFile(path.join(__dirname, '../client/build/index.html')))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

function extract_base_address(url: string): string | undefined {
  const last_slash = url.lastIndexOf('/');
  return last_slash != -1 ? url.substring(0, last_slash) : undefined;
}

type RenderRequest = {
  readonly text?: string;
  readonly url?: string;
}

async function handle_render_slides(req: express.Request, res: express.Response) {
  const query = req.query as RenderRequest;
  res.send(await render_slides(query));
}

type RenderSlidesPostRequest = {
  readonly text: string;
}

async function handle_render_slides_post(req: express.Request, res: express.Response) {
  const query = req.body as RenderSlidesPostRequest;
  const renderedSlides = await render_slides(query)

  res.json({ renderedSlides });
}

async function render_slides(query: RenderRequest): Promise<string> {
  if (query.text != undefined) {    
    return conver_ascii_doc_to_slides(query.text);
  } 
  
  const slides_downloaded_source_code = await request(query.url!);
  const base_address = extract_base_address(query.url!);

  return conver_ascii_doc_to_slides(slides_downloaded_source_code, base_address);
}

function conver_ascii_doc_to_slides(adoc: string, imagesdir?: string): string {
  const options = {
    safe: 'safe', 
    backend: 'revealjs', 
    header_footer: true,
    attributes: {
      revealjsdir: `https://cdnjs.cloudflare.com/ajax/libs/reveal.js/${process.env.REVEALJS_VERSION}/`,
      revealjs_history: "true", // enables slide anchors in the url
      imagesdir
    }
  };

  return asciidoctor.convert(adoc, options);
}
