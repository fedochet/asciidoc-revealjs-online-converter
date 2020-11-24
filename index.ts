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
  .post('/save', wrap(handle_save_slides))
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
  readonly slides_id?: SlidesId; 
}

async function handle_render_slides(req: express.Request, res: express.Response) {
  const query = req.query as RenderRequest;
  res.send(await render_slides(query));
}

async function render_slides(query: RenderRequest): Promise<string> {
  if (query.text != undefined) {    
    return conver_ascii_doc_to_slides(query.text);
  } 
  
  if (query.url != undefined) {
    const slides_downloaded_source_code = await request(query.url);
    const base_address = extract_base_address(query.url);

    return conver_ascii_doc_to_slides(slides_downloaded_source_code, base_address);
  } 
  
  const saved_slides_source_code = saved_slides_cache.get(query.slides_id!!) || "";
  
  return conver_ascii_doc_to_slides(saved_slides_source_code);
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

type SaveSlidesRequest = {
  readonly text: string;
}

type SlidesId = string;

// TODO: replace with RLU cache
const saved_slides_cache = new Map<SlidesId, string>();

async function handle_save_slides(req: express.Request, res: express.Response) {
  const slides_id = save_slides_text(req.body);
  res.end(slides_id);
}

function save_slides_text(query: SaveSlidesRequest): SlidesId {
  const slides_id = hash(query.text);

  saved_slides_cache.set(slides_id, query.text);

  return slides_id;
}

function hash(text: string): string {
  return shajs('sha256').update(text).digest('hex');
}
