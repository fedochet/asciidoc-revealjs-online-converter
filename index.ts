import express from 'express';
import wrap from 'express-async-wrap';
import request from 'request-promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const asciidoctor = require('@asciidoctor/core')();
import asciidoctorRevealjs from '@asciidoctor/reveal.js';
asciidoctorRevealjs.register();

const PORT = process.env.PORT || 5000;

express()
  .set('views', path.join(__dirname, '../views'))
  .set('view engine', 'ejs')
  .get('/', (_, res) => res.render('pages/index'))
  .get('/render', wrap(render_slides))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

function extract_base_address(url: string): string | undefined {
  const last_slash = url.lastIndexOf('/');
  return last_slash != -1 ? url.substring(0, last_slash) : undefined;
}

async function render_slides(req: express.Request, res: express.Response) {
  const slides_url = req.query.url
  
  const result = await request(slides_url);
  const base_address = extract_base_address(slides_url);

  res.send(conver_ascii_doc_to_slides(result, base_address));
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
