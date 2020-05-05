//CARGAMOS EL ARCHIVO DE CONFIGURACIÓN, LAS RUTAS Y LA APLICACIÓN
const config = require('./config'),
  express = require('express'),
  router = require('./router'),
  app = express();

app
  .set('port', process.env.PORT)
  //LIMITO AL SERVIDOR A RECIBIR SOLO INPUT
  .use(express.urlencoded({ extended: false }))
  //LIMITO AL SERVIDOR A RECIBIR Y ENVIAR ARCHIVOS EN FORMATO JSON
  .use(express.json())
  .use(router)
  .listen(process.env.PORT || { port } , () => {

    console.log(`SERVER NODE STARTED ON PORT ${process.env.PORT} :) `);
  
  });