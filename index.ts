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
  .set('views', path.join(__dirname, '../views'))
  .set('view engine', 'ejs')
  .get('/', (_, res) => res.render('pages/index'))
  .get('/live', (_, res) => res.render('pages/live'))
  .get('/render', wrap(handle_render_slides))
  .post('/save', wrap(save_slides_text))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

function extract_base_address(url: string): string | undefined {
  const last_slash = url.lastIndexOf('/');
  return last_slash != -1 ? url.substring(0, last_slash) : undefined;
}

type RenderRequest = {
  readonly text?: string;
  readonly url?: string;
  readonly slides_id?: string; 
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

// TODO: replace with RLU cache
const saved_slides_cache = new Map<string, string>();

async function save_slides_text(req: express.Request, res: express.Response) {
  const slides_source_code = req.body.text;
  const slides_id = hash(slides_source_code);

  saved_slides_cache.set(slides_id, slides_source_code);

  res.end(slides_id);
}

function hash(text: string): string {
  return shajs('sha256').update(text).digest('hex');
}
