const express = require('express')
const wrap = require('express-async-wrap')
const request = require('request-promise');

const asciidoctor = require('asciidoctor.js')();
const asciidoctorRevealjs = require('asciidoctor-reveal.js');
asciidoctorRevealjs.register()

const PORT = process.env.PORT || 5000

express()
  .get('/', wrap(async (req, res) => render_slides(req, res)))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))


async function render_slides(req, res) {
  const result = await request(req.query.file);
  const last_slash = req.query.file.lastIndexOf('/');
  const base_address = last_slash != -1 ? req.query.file.substring(0, last_slash) : undefined;

  res.send(conver_ascii_doc_to_slides(result, base_address));
}

function conver_ascii_doc_to_slides(adoc, imagesdir) {
  const options = {
    safe: 'safe', 
    backend: 'revealjs', 
    header_footer: true,
    attributes: {
      revealjsdir: "https://cdnjs.cloudflare.com/ajax/libs/reveal.js/3.6.0/",
      imagesdir
    }
  };

  return asciidoctor.convert(adoc, options);
}
