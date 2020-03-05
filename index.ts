import express from 'express';
import wrap from 'express-async-wrap';
import request from 'request-promise';
import dotenv from 'dotenv';

dotenv.config();

const asciidoctor = require('@asciidoctor/core')();
import asciidoctorRevealjs from '@asciidoctor/reveal.js';
asciidoctorRevealjs.register();

const PORT = process.env.PORT || 5000;

express()
  .get('/', wrap(render_slides))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

async function render_slides(req: express.Request, res: express.Response) {
  const result = await request(req.query.file);
  const last_slash = req.query.file.lastIndexOf('/');
  const base_address = last_slash != -1 ? req.query.file.substring(0, last_slash) : undefined;

  res.send(conver_ascii_doc_to_slides(result, base_address));
}

function conver_ascii_doc_to_slides(adoc: string, imagesdir: string): string {
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
