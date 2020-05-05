//DEFINIMOS LAS VARIABLES Y CARGAMOS LAS LIBRERIAS INSTALADAS
const config = require('./config'),
  express = require("express"),
  soap = require('soap'),
  request = require('request'),
  jwt = require('jsonwebtoken'),
  path = require('path'),
  os = require("os"),
  pool = require('./data_base'),
  fs = require('fs'),
  functions = require('./functions'),
  logger = require('./logger'),
  dev = require('dotenv').config({ path: process.env.PATH_API_REST }),
  xml = require('fs').readFileSync('./xml/soap.xml', 'utf8'),
  options = {
    method: 'POST'
  },
  api = express.Router();

//REALIZAMOS EL MATCH CON EL XML
var service = {
  MyService: {
      MyPort: {

          Authentication: function(args, cb, headers, req) {

              const nombreUsuario = (headers.Security.UsernameToken.Username == '' || headers.Security.UsernameToken.Username == 0)? '' : headers.Security.UsernameToken.Username;
              const passwordUsuario = (headers.Security.UsernameToken.Password == '' || headers.Security.UsernameToken.Password == 0)? '' : headers.Security.UsernameToken.Password;
              const method = 'SOAP@Authentication';

              if(nombreUsuario === '' || passwordUsuario === ''){

                  message = 'ERROR 202001. DEBE ENVIAR EL USUARIO Y PASSWORD DE MANERA OBLIGATORIA.';
                  message = (nombreUsuario === '' && passwordUsuario !== '') ? 'ERROR 202002. DEBE ENVIAR EL USUARIO DE MANERA OBLIGATORIA.' : message;
                  message = (nombreUsuario !== '' && passwordUsuario === '') ? 'ERROR 202003. DEBE ENVIAR EL PASSWORD DE MANERA OBLIGATORIA.' : message;

                  const ip = functions.getIpCliente(req); 
                  logger.info(functions.getMessageLog(ip,nombreUsuario,method,message,'')); //os.platform()

                  mensaje_generado = `<AUTENTICATION>
                        <RETURN>
                            <ERROR>1</ERROR>
                            <ERMSG> ${message} </ERMSG>
                        </RETURN>
                    </AUTENTICATION>`;

                  return {
                    error: mensaje_generado
                  };

              }else{

                  options.url = process.env.CONFIG_URL_AUTHENTICATION;
                  options.headers = {
                      'usuario':nombreUsuario,
                      'password':passwordUsuario
                  };
                  
                  return new Promise(function(resolve, reject){

                      request(options, function (error, response, body) {
                          
                          var data = JSON.parse(body);
                        
                          //VALIDO EL TOKEN DEL RESFULL ESTA ACTIVO
                          if (data.estado) { 

                            var tokenData = {
                              nombreUsuario: nombreUsuario,
                              passwordUsuario: passwordUsuario
                            }

                            //TOKEN SE ALMACENA EN COOKIES O LOCALSTORAGE DEL NAVEGADOR
                            var token = jwt.sign(tokenData, 'M0v1stAr#2&', {
                              //EXPIRA EN X MINUTOS Y SOLICITA NUEVAMENTE UN NUEVO TOKEN
                              expiresIn: process.env.LIFETIME_TOKEN+'m'
                            })

                            var f = new Date();  
                            const fecha_actual = f.getFullYear() + "-" + (f.getMonth() +1) + "-" + f.getDate() + " " + f.getHours() + ":" + f.getMinutes() + ":" + f.getSeconds();


                            var query = pool.query('INSERT INTO api_services(token_temporary,token_service,user_service,time_service) VALUES(?, ?, ?, ?)', [token, data.headers.Authorization, nombreUsuario, fecha_actual], function(error, result){
                            
                              if (error) {

                                message = 'ERROR 202015. ERROR DE CODIGO EN EL PROCESO DE CONSULTA A LA BASE DE DATOS.';
                                const ip = functions.getIpCliente(req);
                                logger.info(ip+` ${method} \n Respuesta: `+message+` \n`);

                                mensaje_generado = `<AUTENTICATION>
                                    <RETURN>
                                        <ERMSG>1</ERMSG>
                                        <ERMSG>ERROR: ${message}</ERMSG>
                                    </RETURN>
                                  </AUTENTICATION>`;

                                //ENVIAMOS RESPUESTA DE CONSULTA
                                resolve({
                                  error: mensaje_generado
                                });

                              }else{

                                const ip = functions.getIpCliente(req);
                                const token_generado =  'Bearer '+token;
                                logger.info(functions.getMessageLog(ip,nombreUsuario,method,token_generado,''));

                                mensaje_generado = `<AUTENTICATION>
                                      <RETURN>
                                          <TOKEN>${token_generado}</TOKEN>
                                      </RETURN>
                                  </AUTENTICATION>`;

                                //ENVIAMOS RESPUESTA DE CONSULTA
                                resolve({
                                  resultado: mensaje_generado
                                });

                              }
                              
                            });

                          }else {

                            message = data.message.Error;
                            const ip = functions.getIpCliente(req);
                            logger.info(functions.getMessageLog(ip,nombreUsuario,method,message,''));

                            mensaje_generado = `<AUTENTICATION>
                                  <RETURN>
                                      <ERROR>1</ERROR>
                                      <ERMSG> ${message} </ERMSG>
                                  </RETURN>
                              </AUTENTICATION>`;

                            resolve({
                              error: mensaje_generado
                            });

                          }
                        
                      });

                  });

              }

          },

          getInfoBasicaServicioHFCxCliente: function(args, cb, headers, req) {

            var idCliente = args.idCliente;
            idCliente = (idCliente === null || idCliente === '')? '' : idCliente;
            
            const nombreUsuario = (headers.Security.UsernameToken.Username == '' || headers.Security.UsernameToken.Username == 0)? '' : headers.Security.UsernameToken.Username;
            const authorization = req.headers.authorization;  
            var token = ( !authorization || authorization.trim() === null || authorization.trim() === '')? '' : authorization;  //Token enviado (Header -> Authorization  Bearer eyJhbGciO....)
            token = token.replace('Bearer ', '');
            const method = 'SOAP@getInfoBasicaServicioHFCxCliente';

            if(token === '' || idCliente === '' || idCliente == 0 || isNaN(idCliente) || nombreUsuario === ''){

                  message = (isNaN(idCliente)) ? 'ERROR 202010. CODIGO DE CLIENTE TIENE QUE SER NUMERICO.' : '';
                  message = (idCliente == 0) ? '202011. CODIGO DE CLIENTE NO PUEDE SER CERO.' : message;
                  message = (idCliente === '') ? 'ERROR 202012. DEBE ENVIAR CODIGO DE CLIENTE DE MANERA OBLIGATORIA.' : message;
                  message = (nombreUsuario === '') ? 'ERROR 202002. DEBE ENVIAR EL USUARIO DE MANERA OBLIGATORIA.' : message; 
                  message = (token === '') ? 'ERROR 202013. DEBE ENVIAR CODIGO DE AUTORIZACION DE MANERA OBLIGATORIA.' : message;

                  const ip = functions.getIpCliente(req);
                  logger.info(functions.getMessageLog(ip,nombreUsuario,method,message,''));

                  message_generado = `<CLIENTE>
                        <RETURN>
                            <ERROR>1</ERROR>
                            <ERMSG>ERROR: ${message} </ERMSG>
                        </RETURN>
                    </CLIENTE>`;

                  return {
                    error: message_generado
                  };

            }else{

                options.url = process.env.CONFIG_URL_ESTADO_CLIENTE_HFC;
                options.form = {
                  'idCliente':idCliente
                };

                return new Promise(function(resolve, reject){
                
                  jwt.verify(token, 'M0v1stAr#2&', function(err, decoded) {
                    
                    if(err) {

                      const ip = functions.getIpCliente(req);
                      const message = 'ERROR 202014. TOKEN INVÁLIDO. VERIFICAR O GENERAR UNO NUEVO.';
                      message_generado = `<CLIENTE>
                                  <RETURN>
                                      <ERROR>1</ERROR>
                                      <ERMSG> ${message} </ERMSG>
                                  </RETURN>
                              </CLIENTE>`;

                      logger.info(functions.getMessageLog(ip,nombreUsuario,method,message,''));

                      //ENVIAMOS RESPUESTA DE CONSULTA
                      resolve({
                            error: message_generado
                      });

                    } else {

                      var query = pool.query('SELECT token_service,user_service FROM api_services WHERE token_temporary = ? and user_service= ?', [token, nombreUsuario], (error, result) => {
                     
                        if (error) {

                          message = 'ERROR 202015. ERROR DE CODIGO EN EL PROCESO DE CONSULTA A LA BASE DE DATOS.';
                          const ip = functions.getIpCliente(req);
                          logger.info(functions.getMessageLog(ip,nombreUsuario,method,message,''));

                          message_generado = `<CLIENTE>
                                  <RETURN>
                                      <ERROR>1</ERROR>
                                      <ERMSG> ${message} </ERMSG>
                                  </RETURN>
                              </CLIENTE>`;

                          resolve({
                            error: message_generado
                          });

                        }
                        
                        if(!result || result==null || result == ''){

                          message = 'ERROR 202016. ERROR DE VALIDACIÓN DE CREDENCIALES.';
                          const ip = functions.getIpCliente(req);
                          logger.info(functions.getMessageLog(ip,nombreUsuario,method,message,''));
                         
                          message_generado = `<CLIENTE>
                                  <RETURN>
                                      <ERROR>1</ERROR>
                                      <ERMSG> ${message} </ERMSG>
                                  </RETURN>
                              </CLIENTE>`;

                          //ENVIAMOS RESPUESTA DE CONSULTA
                          resolve({
                            error: message_generado
                          });

                        }else{

                          var data = JSON.parse(JSON.stringify(result));
                          const token_service = data[0]['token_service'];
                         
                          if(token_service){

                              options.headers = {
                                  'Token': token_service,
                                  'Username': nombreUsuario
                              };
                              
                              request(options, function (error, response, body) {

                                var body = JSON.parse(body);  //json a objeto

                                //Validamos si existe un error
                                if (typeof body.respuesta === 'object') {

                                  const ip = functions.getIpCliente(req);
                                  const message = body.respuesta.Error;
                                  logger.info(functions.getMessageLog(ip,nombreUsuario,method,message,''));

                                  message_generado = `<CLIENTE>
                                              <RETURN>
                                                  <ERROR>1</ERROR>
                                                  <ERMSG> ${message} </ERMSG>
                                              </RETURN>
                                          </CLIENTE>`;

                                  resolve({
                                        error: message_generado
                                  });

                                }else{
                                
                                  servicios = body.mensaje;
                                  var XML_RETURN = '';
                                  var incrementador = 0;
                                  const cantidad = Object.keys(servicios).length;

                                  XML_RETURN += `<CLIENTE><RETURN><CANTIDAD>${cantidad}</CANTIDAD>`
                                  for (var indice in servicios){

                                      incrementador += 1;

                                        XML_RETURN += `<SERVICIO${incrementador}>
                                                        <Cmts>${servicios[indice]['Cmts']}</Cmts>
                                                        <Nodo>${servicios[indice]['Nodo']}</Nodo>
                                                        <Troba>${servicios[indice]['Troba']}</Troba>
                                                        <ServicePackage>${servicios[indice]['ServicePackage']}</ServicePackage>
                                                        <Ussnr>${servicios[indice]['Ussnr']}</Ussnr>
                                                        <Dssnr>${servicios[indice]['Dssnr']}</Dssnr>
                                                        <IpCm>${servicios[indice]['IpCm']}</IpCm>
                                                        <MacAddress>${servicios[indice]['MacAddress']}</MacAddress>
                                                        <Fabricante>${servicios[indice]['Fabricante']}</Fabricante>
                                                        <Modelo>${servicios[indice]['Modelo']}</Modelo>
                                                        <Firmware>${servicios[indice]['Firmware']}</Firmware>
                                                        <IspCpe>${servicios[indice]['IspCpe']}</IspCpe>
                                                        <EstadoModem>${servicios[indice]['EstadoModem']}</EstadoModem>
                                                        <PowerUp>${servicios[indice]['PowerUp']}</PowerUp>
                                                        <PowerDown>${servicios[indice]['PowerDown']}</PowerDown>
                                                        <MACState>${servicios[indice]['MACState']}</MACState>
                                                        <Mensaje>${servicios[indice]['Mensaje']}</Mensaje>                                
                                                    </SERVICIO${incrementador}>`;

                                  }
                                  XML_RETURN += `</RETURN></CLIENTE>`

                                  if(args.informacion && args.informacion !== '') XML_RETURN += `<INFORMACION>${args.informacion}</INFORMACION>`

                                  const ip = functions.getIpCliente(req);
                                  logger.info(functions.getMessageLog(ip,nombreUsuario,method,XML_RETURN,''));

                                  resolve({
                                    RESULTADO : XML_RETURN
                                  });

                                }
                                
                              });

                          }

                        }
                        
                      });

                    }
                    
                  });

                });

            }
            
          },

          multiconsultaIdCliente: function(args, cb, headers, req) {
              
              const method = 'SOAP@multiconsultaIdCliente';
              const message = 'Método Obsoleto, usar el metodo getInfoBasicaServicioHFCxCliente';
              const nombreUsuario = (headers.Security.UsernameToken.Username !== '')? headers.Security.UsernameToken.Username: '';
              const ip = functions.getIpCliente(req);
              logger.info(functions.getMessageLog(ip,nombreUsuario,method,message,''));

              args.informacion = message;
              return redirectInfoBasicaServicioHFCxCliente(args, cb, headers, req);
                
          },

          getInfoEstadoServicioHFCxCliente: function(args, cb, headers, req) {

            var idCliente = args.idCliente;
            idCliente = (idCliente === null || idCliente === '')? '' : idCliente;
            const nombreUsuario = (headers.Security.UsernameToken.Username == '' || headers.Security.UsernameToken.Username == 0)? '' : headers.Security.UsernameToken.Username;
            const authorization = req.headers.authorization;  
            var token = (authorization.trim() === null || authorization.trim() === '')? '' : authorization;
            token = token.replace('Bearer ', '');
            const method = 'SOAP@getInfoEstadoServicioHFCxCliente';
            const usuario = `Usuario:${nombreUsuario}`;

            if(token === '' || idCliente === '' || idCliente == 0 || isNaN(idCliente) || nombreUsuario === ''){

                  message = (isNaN(idCliente)) ? 'ERROR 202010. CODIGO DE CLIENTE TIENE QUE SER NUMERICO.' : '';
                  message = (idCliente == 0) ? '202011. CODIGO DE CLIENTE NO PUEDE SER CERO.' : message;
                  message = (idCliente === '') ? 'ERROR 202012. DEBE ENVIAR CODIGO DE CLIENTE DE MANERA OBLIGATORIA.' : message;
                  message = (nombreUsuario === '') ? 'ERROR 202002. DEBE ENVIAR EL USUARIO DE MANERA OBLIGATORIA.' : message; 
                  message = (token === '') ? 'ERROR 202013. DEBE ENVIAR CODIGO DE AUTORIZACION DE MANERA OBLIGATORIA.' : message;

                  const ip = functions.getIpCliente(req);
                  logger.info(functions.getMessageLog(ip,nombreUsuario,method,message,''));

                  message_generado = `<CLIENTE>
                        <RETURN>
                            <ERROR>1</ERROR>
                            <ERMSG>ERROR: ${message}.</ERMSG>
                        </RETURN>
                    </CLIENTE>`;

                  return {
                    error: message_generado
                  };

            }else{

                options.url = process.env.CONFIG_URL_ESTADO_SERVICIO_HFC;
                options.form = {
                  //'nombreUsuario':nombreUsuario,
                  'idCliente':idCliente
                };

                return new Promise(function(resolve, reject){
                
                  jwt.verify(token, 'M0v1stAr#2&', function(err, decoded) {
                    
                    if(err) {

                      const ip = functions.getIpCliente(req);
                      const message = 'ERROR 202014. TOKEN INVÁLIDO. VERIFICAR O GENERAR UNO NUEVO.';
                      message_generado = `<CLIENTE>
                                  <RETURN>
                                      <ERROR>1</ERROR>
                                      <ERMSG> ${message} </ERMSG>
                                  </RETURN>
                              </CLIENTE>`;

                      logger.info(functions.getMessageLog(ip,nombreUsuario,method,message,''));

                      resolve({
                            error: message_generado
                      });
                      

                    } else {

                      var query = pool.query('SELECT token_service,user_service FROM api_services WHERE token_temporary = ? and user_service= ?', [token, nombreUsuario], (error, result) => {
                     
                        if (error) {

                          message = 'ERROR 202015. ERROR DE CODIGO EN EL PROCESO DE CONSULTA A LA BASE DE DATOS.';
                          const ip = functions.getIpCliente(req);
                          logger.info(functions.getMessageLog(ip,nombreUsuario,method,message,''));

                          message_generado = `<CLIENTE>
                                  <RETURN>
                                      <ERROR>1</ERROR>
                                      <ERMSG> ${message} </ERMSG>
                                  </RETURN>
                              </CLIENTE>`;

                          resolve({
                            error: message_generado
                          });

                        }
                        
                        if(!result || result==null || result == ''){

                          message = 'ERROR 202016. ERROR DE VALIDACIÓN DE CREDENCIALES.';
                          const ip = functions.getIpCliente(req);
                          logger.info(functions.getMessageLog(ip,nombreUsuario,method,message,''));
                         
                          message_generado = `<CLIENTE>
                                  <RETURN>
                                      <ERROR>1</ERROR>
                                      <ERMSG> ${message} </ERMSG>
                                  </RETURN>
                              </CLIENTE>`;

                          resolve({
                            error: message_generado
                          });

                        }else{

                          var data = JSON.parse(JSON.stringify(result));
                          const token_service = data[0]['token_service'];
                         
                          if(token_service){

                              options.headers = {
                                  'Token': token_service,
                                  'Username': nombreUsuario
                              };
                              //console.log(row.token_service);
                              request(options, function (error, response, body) {
                                
                                var body = JSON.parse(body);

                                if (typeof body.respuesta === 'object') {

                                  const ip = functions.getIpCliente(req);
                                  const message = body.respuesta.Error;
                                  
                                  logger.info(functions.getMessageLog(ip,nombreUsuario,method,message,''));

                                  message_generado = `<CLIENTE>
                                              <RETURN>
                                                  <ERROR>1</ERROR>
                                                  <ERMSG> ${message} </ERMSG>
                                              </RETURN>
                                          </CLIENTE>`;

                                  //ENVIAMOS RESPUESTA DE CONSULTA
                                  resolve({
                                        error: message_generado
                                  });

                                }else{
                                
                                  //var body = JSON.parse(body);
                                  //console.log(body.mensaje);

                                  disponibilidadIP = body.mensaje.IPS.DisponibilidadIP;
                                  trabajoProgramado = body.mensaje.TrabajoProgramado.EnTrabajoProgramado;
                                  masiva = body.mensaje.Masiva.EnMasiva;
                                  alertado = body.mensaje.Alertado.EstaAlertado;

                                  var XML_RETURN = '';
                                  XML_RETURN += `<CLIENTE><RETURN><IDCliente>${idCliente}</IDCliente>`

                                  if (disponibilidadIP === 'OK') {
                                      XML_RETURN += `<IPS><DisponibilidadIP>${disponibilidadIP}</DisponibilidadIP></IPS>`
                                  }else{
                                    
                                    XML_RETURN += `<IPS><DisponibilidadIP>${disponibilidadIP}</DisponibilidadIP>`
                                    disponibilidadIPServices = body.mensaje.IPS.Servicios;
                                    var incrementador = 0;
                                    for (var indice in disponibilidadIPServices){

                                      incrementador += 1;
                                      
                                      XML_RETURN += `<DataIPS${incrementador}>
                                                        <DetalleIPS CMTS>${disponibilidadIPServices[indice]['DetalleIPS CMTS']}</DetalleIPS CMTS>
                                                        <DetalleTipoIPS SCOPEGROUP>${disponibilidadIPServices[indice]['DetalleTipoIPS SCOPEGROUP']}</DetalleTipoIPS SCOPEGROUP>
                                                        <TOTAL>${disponibilidadIPServices[indice]['TOTAL']}</TOTAL>
                                                        <DISPONIBLES>${disponibilidadIPServices[indice]['DISPONIBLES']}</DISPONIBLES>                               
                                                    </DataIPS${incrementador}>`;
                                                    
                                      incrementador ++;

                                    }
                                    XML_RETURN += `</IPS>`

                                  }

                                  if (trabajoProgramado === 'NOK') {
                                      XML_RETURN += `<TrabajoProgramado><EnTrabajoProgramado>${trabajoProgramado}</EnTrabajoProgramado></TrabajoProgramado>`
                                  }else{

                                      XML_RETURN += `<TrabajoProgramado><EnTrabajoProgramado>${trabajoProgramado}</EnTrabajoProgramado>`
                                      trabajoProgramadoServicios = body.mensaje.TrabajoProgramado.Servicios;
                                      //console.log(trabajoProgramadoServicios);
                                      var incrementador = 0;
                                      for (var indice in trabajoProgramadoServicios){

                                        incrementador += 1;
                                        
                                        XML_RETURN += `<DataTP${incrementador}>
                                                          <DetalleTP NODO>${trabajoProgramadoServicios[indice]['DetalleTP NODO']}</DetalleTP NODO>
                                                          <DetalleTP TROBA>${trabajoProgramadoServicios[indice]['DetalleTP TROBA']}</DetalleTP TROBA>
                                                          <Estado>${trabajoProgramadoServicios[indice]['Estado']}</Estado>
                                                          <FechaInicio>${trabajoProgramadoServicios[indice]['FechaInicio']}</FechaInicio>
                                                          <FechaCierre>${trabajoProgramadoServicios[indice]['FechaCierre']}</FechaCierre>
                                                          <FechaCancelada>${trabajoProgramadoServicios[indice]['FechaCancelada']}</FechaCancelada>
                                                          <TipoTrabajoP>${trabajoProgramadoServicios[indice]['TipoTrabajoP']}</TipoTrabajoP>                               
                                                      </DataTP${incrementador}>`;
                                                      
                                        incrementador ++;

                                      }
                                      XML_RETURN += `</TrabajoProgramado>`

                                  }

                                  if (masiva === 'NOK') {
                                      XML_RETURN += `<Masiva><EnMasiva>${masiva}</EnMasiva></Masiva>`
                                  }else{

                                      XML_RETURN += `<Masiva><EnMasiva>${masiva}</EnMasiva>`
                                      masivaServicios = body.mensaje.Masiva.Servicios;
                                      //console.log(masivaServicios);
                                      var incrementador = 0;
                                      for (var indice in masivaServicios){

                                        incrementador += 1;
                                        
                                        XML_RETURN += `<DataMasiva${incrementador}>
                                                          <DetalleMasiva NODO>${masivaServicios[indice]['DetalleMasiva NODO']}</DetalleMasiva NODO>
                                                          <DetalleMasiva TROBA>${masivaServicios[indice]['DetalleMasiva TROBA']}</DetalleMasiva TROBA>
                                                          <MAC>${masivaServicios[indice]['MAC']}</MAC>
                                                          <MacState>${masivaServicios[indice]['MacState']}</MacState>                              
                                                      </DataMasiva${incrementador}>`;
                                                      
                                        incrementador ++;

                                      }
                                      XML_RETURN += `</Masiva>`

                                  }

                                  if (alertado === 'NOK') {
                                      XML_RETURN += `<Alertado><EstaAlertado>${alertado}</EstaAlertado></Alertado>`
                                  }else{

                                      XML_RETURN += `<Alertado><EstaAlertado>${alertado}</EstaAlertado></Alertado>`
                                      alertadoServicios = body.mensaje.Alertado.Servicios;
                                      //console.log(alertadoServicios);
                                      var incrementador = 0;
                                      for (var indice in alertadoServicios){

                                        incrementador += 1;
                                        
                                        XML_RETURN += `<DataAL${incrementador}>
                                                          <DetalleAlertado NODO>${alertadoServicios[indice]['DetalleAlertado NODO']}</DetalleAlertado NODO>
                                                          <DetalleAlertado TROBA>${alertadoServicios[indice]['DetalleAlertado TROBA']}</DetalleAlertado TROBA>
                                                          <MAC>${alertadoServicios[indice]['MAC']}</MAC>
                                                          <MacState>${alertadoServicios[indice]['MacState']}</MacState>
                                                          <TIPOALERTA>${alertadoServicios[indice]['TIPOALERTA']}</TIPOALERTA>
                                                          <ELEMENTOAFECTADO>${alertadoServicios[indice]['ELEMENTOAFECTADO']}</ELEMENTOAFECTADO>                        
                                                      </DataAL${incrementador}>`;
                                                      
                                        incrementador ++;

                                      }
                                      XML_RETURN += `</Alertado>`

                                  }

                                  if(args.informacion && args.informacion !== '') XML_RETURN += `<INFORMACION>${args.informacion}</INFORMACION>`
                                  XML_RETURN += `</RETURN></CLIENTE>`

                                  if(args.informacion && args.informacion !== '') XML_RETURN += `<INFORMACION>${args.informacion}</INFORMACION>`

                                  const ip = functions.getIpCliente(req);
                                  
                                  logger.info(functions.getMessageLog(ip,nombreUsuario,method,XML_RETURN,''));

                                  resolve({
                                    RESULTADO : XML_RETURN
                                  });

                                }

                              });

                          }

                        }
                        
                      });

                    }
                    
                  });

                });

            }
            
          },

          verifyHFCByIdClient: function(args, cb, headers, req) {

              const method = 'SOAP@verifyHFCByIdClientResponse';
              const message = 'Método Obsoleto, usar el metodo getInfoEstadoServicioHFCxCliente';
              const nombreUsuario = (headers.Security.UsernameToken.Username !== '')? headers.Security.UsernameToken.Username: '';
              const ip = functions.getIpCliente(req);
              logger.info(functions.getMessageLog(ip,nombreUsuario,method,message,''));

              args.informacion = message;
              return redirectgetInfoEstadoServicioHFCxCliente(args, cb, headers, req);
              
          },

          getPruebasCablemodem: function(args, cb, headers, req) {

            var mac_address = (args.mac_address === null || args.mac_address === '')? '' : args.mac_address;
            const nombreUsuario = (headers.Security.UsernameToken.Username == '' || headers.Security.UsernameToken.Username == 0)? '' : headers.Security.UsernameToken.Username;
            const authorization = req.headers.authorization;  
            var token = ( !authorization || authorization.trim() === null || authorization.trim() === '')? '' : authorization;
            token = token.replace('Bearer ', '');
            const method = 'SOAP@getPruebasCablemodem';

            if(token === '' || nombreUsuario === '' || mac_address === '' || mac_address == 0){
                
                  message = (mac_address == 0) ? 'ERROR 202018. MACADDRESS NO PUEDE SER CERO.' : '';
                  message = (mac_address === '') ? 'ERROR 202019. DEBE ENVIAR LA MACADDRESS DE MANERA OBLIGATORIA.' : message;
                  message = (nombreUsuario === '') ? 'ERROR 202002. DEBE ENVIAR EL USUARIO DE MANERA OBLIGATORIA.' : message; 
                  message = (token === '') ? 'ERROR 202013. DEBE ENVIAR CODIGO DE AUTORIZACION DE MANERA OBLIGATORIA.' : message;

                  const ip = functions.getIpCliente(req);
                  logger.info(functions.getMessageLog(ip,nombreUsuario,method,message,''));

                  message_generado = `<CLIENTE>
                        <RETURN>
                            <ERMSG>1</ERMSG>
                            <ERMSG>ERROR: ${message}</ERMSG>
                        </RETURN>
                    </CLIENTE>`;

                  return {
                    error: message_generado
                  };

            }else{

                options.url = process.env.CONFIG_URL_PRUEBAS_CABLE_MODEM;
                options.form = {
                  'mac_address':mac_address
                };

                return new Promise(function(resolve, reject){
                
                  jwt.verify(token, 'M0v1stAr#2&', function(err, decoded) {
                    
                    if(err) {

                      const ip = functions.getIpCliente(req);
                      const message = 'ERROR 202014. TOKEN INVÁLIDO. VERIFICAR O GENERAR UNO NUEVO.';
                      message_generado = `<CLIENTE>
                                  <RETURN>
                                      <ERROR>1</ERROR>
                                      <ERMSG> ${message} </ERMSG>
                                  </RETURN>
                              </CLIENTE>`;

                      logger.info(functions.getMessageLog(ip,nombreUsuario,method,message,''));

                      //ENVIAMOS RESPUESTA DE CONSULTA
                      resolve({
                            error: message_generado
                      });

                    } else {

                      var query = pool.query('SELECT token_service,user_service FROM api_services WHERE token_temporary = ? and user_service= ?', [token, nombreUsuario], (error, result) => {
                     
                        if (error) {

                          message = 'ERROR 202015. ERROR DE CODIGO EN EL PROCESO DE CONSULTA A LA BASE DE DATOS.';
                          const ip = functions.getIpCliente(req);
                          logger.info(functions.getMessageLog(ip,nombreUsuario,method,message,''));

                          message_generado = `<CLIENTE>
                                  <RETURN>
                                      <ERROR>1</ERROR>
                                      <ERMSG> ${message} </ERMSG>
                                  </RETURN>
                              </CLIENTE>`;

                          resolve({
                            error: message_generado
                          });

                        }
                        
                        if(!result || result==null || result == ''){

                          message = 'ERROR 202016. ERROR DE VALIDACIÓN DE CREDENCIALES.';
                          const ip = functions.getIpCliente(req);
                          logger.info(functions.getMessageLog(ip,nombreUsuario,method,message,''));
                         
                          message_generado = `<CLIENTE>
                                  <RETURN>
                                      <ERROR>1</ERROR>
                                      <ERMSG> ${message} </ERMSG>
                                  </RETURN>
                              </CLIENTE>`;

                          //ENVIAMOS RESPUESTA DE CONSULTA
                          resolve({
                            error: message_generado
                          });

                        }else{
                          
                          var data = JSON.parse(JSON.stringify(result));
                          const token_service = data[0]['token_service'];
                          
                          if(token_service){

                              options.headers = {
                                  'Token': token_service,
                                  'Username': nombreUsuario
                              };
                              
                              request(options, function (error, response, body) {
                                
                                var body = JSON.parse(body);  //json a objeto

                                //Validamos si existe un error
                                if (typeof body.respuesta === 'object') {

                                  const ip = functions.getIpCliente(req);
                                  const message = body.respuesta.Error;
                                  logger.info(functions.getMessageLog(ip,nombreUsuario,method,message,''));

                                  message_generado = `<CLIENTE>
                                              <RETURN>
                                                  <ERROR>1</ERROR>
                                                  <ERMSG> ${message} </ERMSG>
                                              </RETURN>
                                          </CLIENTE>`;

                                  resolve({
                                        error: message_generado
                                  });

                                }else{
                                
                                  mensajes = body.mensaje;
                                  parametros = mensajes.Parametros;
                                  const ip = functions.getIpCliente(req);

                                  var XML_RETURN = '';
                                  var XML_STRING_RETURN = '';
                                  var incrementador = 0;

                                  XML_RETURN += `<CLIENTE><RETURN><SenalOK>${mensajes.SenalOK}</SenalOK>`
                                  XML_STRING_RETURN += '0#'
                                  for (var indice in parametros){

                                      incrementador += 1;

                                        XML_STRING_RETURN += `${parametros[indice]['Nombre']}|${parametros[indice]['Valor']}|`
                                        XML_RETURN += `<Parametro${incrementador}>
                                                        <Nombre>${parametros[indice]['Nombre']}</Nombre>
                                                        <Valor>${parametros[indice]['Valor']}</Valor>                               
                                                    </Parametro${incrementador}>`;

                                  }
                                  XML_STRING_RETURN = XML_STRING_RETURN.substring(0, XML_STRING_RETURN.length - 1);
                                  XML_STRING_RETURN += `#${mensajes.Resultado}`
                                  XML_RETURN += `<Resultado>${mensajes.Resultado}</Resultado><Mensaje>${XML_STRING_RETURN}</Mensaje></RETURN></CLIENTE>`;

                                  logger.info(functions.getMessageLog(ip,nombreUsuario,method,XML_RETURN,''));
                                  resolve({
                                    RESULTADO : XML_RETURN
                                  });

                                }
                                
                              });

                          }
                          
                        }
                        
                      });

                    }
                    
                  });

                });

            }
            
          },

          getPruebasCablemodemIW: function(args, cb, headers, req) {

            var idservicio = args.idservicio;
            idservicio = (idservicio === null || idservicio === '')? '' : idservicio;
            var idproducto = args.idproducto;
            idproducto = (idproducto === null || idproducto === '')? '' : idproducto;
            var mac_address = (args.mac_address === null || args.mac_address === '')? '' : args.mac_address;
            const nombreUsuario = (headers.Security.UsernameToken.Username == '' || headers.Security.UsernameToken.Username == 0)? '' : headers.Security.UsernameToken.Username;
            const authorization = req.headers.authorization;  
            var token = ( !authorization || authorization.trim() === null || authorization.trim() === '')? '' : authorization;
            token = token.replace('Bearer ', '');
            const method = 'SOAP@getPruebasCablemodemIW';

            if(token === '' || nombreUsuario === '' || mac_address === '' || mac_address == 0 || idservicio === '' || idservicio == 0 || isNaN(idservicio) || idproducto === '' || idproducto == 0 || isNaN(idproducto)){
               
                  message = (mac_address == 0) ? 'ERROR 202018. MACADDRESS NO PUEDE SER CERO.' : '';
                  message = (mac_address === '') ? 'ERROR 202019. DEBE ENVIAR LA MACADDRESS DE MANERA OBLIGATORIA.' : message;
                  message = (isNaN(idproducto)) ? 'ERROR 202020. ID DE PRODUCTO TIENE QUE SER NUMERICO.' : message;
                  message = (idproducto == 0) ? 'ERROR 202021. ID DEL PRODUCTO NO PUEDE SER CERO.' : message;
                  message = (idproducto === '') ? 'ERROR 202022. DEBE ENVIAR LA ID DEL PRODUCTO DE MANERA OBLIGATORIA.' : message;
                  message = (isNaN(idservicio)) ? 'ERROR 202023. ID DE SERVICIO TIENE QUE SER NUMERICO.' : message;
                  message = (idservicio == 0) ? 'ERROR 202024. ID DE SERVICIO NO PUEDE SER CERO.' : message;
                  message = (idservicio === '') ? 'ERROR 202025. DEBE ENVIAR LA ID DE SERVICIO DE MANERA OBLIGATORIA.' : message;
                  message = (nombreUsuario === '') ? 'ERROR 202002. DEBE ENVIAR EL USUARIO DE MANERA OBLIGATORIA.' : message; 
                  message = (token === '') ? 'ERROR 202013. DEBE ENVIAR CODIGO DE AUTORIZACION DE MANERA OBLIGATORIA.' : message;

                  const ip = functions.getIpCliente(req);
                  logger.info(functions.getMessageLog(ip,nombreUsuario,method,message,''));

                  message_generado = `<CLIENTE>
                        <RETURN>
                            <ERMSG>1</ERMSG>
                            <ERMSG>ERROR: ${message}</ERMSG>
                        </RETURN>
                    </CLIENTE>`;

                  return {
                    error: message_generado
                  };

            }else{

                options.url = process.env.CONFIG_URL_PRUEBAS_CABLE_MODEM_IW;
                options.form = {
                  'mac_address':mac_address,
                  'idservicio':idservicio,
                  'idproducto':idproducto
                };

                return new Promise(function(resolve, reject){
                
                  jwt.verify(token, 'M0v1stAr#2&', function(err, decoded) {
                    
                    if(err) {

                      const ip = functions.getIpCliente(req);
                      const message = 'ERROR 202014. TOKEN INVÁLIDO. VERIFICAR O GENERAR UNO NUEVO.';
                      message_generado = `<CLIENTE>
                                  <RETURN>
                                      <ERROR>1</ERROR>
                                      <ERMSG> ${message} </ERMSG>
                                  </RETURN>
                              </CLIENTE>`;

                      logger.info(functions.getMessageLog(ip,nombreUsuario,method,message,''));

                      //ENVIAMOS RESPUESTA DE CONSULTA
                      resolve({
                            error: message_generado
                      });

                    } else {

                      var query = pool.query('SELECT token_service,user_service FROM api_services WHERE token_temporary = ? and user_service= ?', [token, nombreUsuario], (error, result) => {
                     
                        if (error) {

                          message = 'ERROR 202015. ERROR DE CODIGO EN EL PROCESO DE CONSULTA A LA BASE DE DATOS.';
                          const ip = functions.getIpCliente(req);
                          logger.info(functions.getMessageLog(ip,nombreUsuario,method,message,''));

                          message_generado = `<CLIENTE>
                                  <RETURN>
                                      <ERROR>1</ERROR>
                                      <ERMSG> ${message} </ERMSG>
                                  </RETURN>
                              </CLIENTE>`;

                          resolve({
                            error: message_generado
                          });

                        }
                        
                        if(!result || result==null || result == ''){

                          message = 'ERROR 202016. ERROR DE VALIDACIÓN DE CREDENCIALES.';
                          const ip = functions.getIpCliente(req);
                          logger.info(functions.getMessageLog(ip,nombreUsuario,method,message,''));
                         
                          message_generado = `<CLIENTE>
                                  <RETURN>
                                      <ERROR>1</ERROR>
                                      <ERMSG> ${message} </ERMSG>
                                  </RETURN>
                              </CLIENTE>`;

                          //ENVIAMOS RESPUESTA DE CONSULTA
                          resolve({
                            error: message_generado
                          });

                        }else{
                          
                          var data = JSON.parse(JSON.stringify(result));
                          const token_service = data[0]['token_service'];
                          
                          if(token_service){

                              options.headers = {
                                  'Token': token_service,
                                  'Username': nombreUsuario
                              };
                              
                              request(options, function (error, response, body) {
                                
                                var body = JSON.parse(body);  //json a objeto
                                //Validamos si existe un error
                                if (typeof body.respuesta === 'object') {

                                  const ip = functions.getIpCliente(req);
                                  const message = body.respuesta.Error;
                                  logger.info(functions.getMessageLog(ip,nombreUsuario,method,message,''));

                                  message_generado = `<CLIENTE>
                                              <RETURN>
                                                  <ERROR>1</ERROR>
                                                  <ERMSG> ${message} </ERMSG>
                                              </RETURN>
                                          </CLIENTE>`;

                                  resolve({
                                        error: message_generado
                                  });

                                }else{
                                
                                  mensajes = body.mensaje;
                                  parametros = mensajes.Parametros;
                                  const ip = functions.getIpCliente(req);

                                  //console.log(mensajes);

                                  var XML_RETURN = '';
                                  var XML_STRING_RETURN = '';
                                  var incrementador = 0;

                                  XML_RETURN += `<CLIENTE><RETURN><SenalOK>${mensajes.SenalOK}</SenalOK>`
                                  XML_STRING_RETURN += '0#'
                                  for (var indice in parametros){

                                      incrementador += 1;

                                        XML_STRING_RETURN += `${parametros[indice]['Nombre']}|${parametros[indice]['Valor']}|`
                                        XML_RETURN += `<Parametro${incrementador}>
                                                        <Nombre>${parametros[indice]['Nombre']}</Nombre>
                                                        <Valor>${parametros[indice]['Valor']}</Valor>                               
                                                    </Parametro${incrementador}>`;

                                  }
                                  XML_STRING_RETURN = XML_STRING_RETURN.substring(0, XML_STRING_RETURN.length - 1);
                                  //XML_STRING_RETURN += `#${mensajes.Resultado}`
                                  XML_RETURN += `<Mensaje>${XML_STRING_RETURN}</Mensaje></RETURN></CLIENTE>`;

                                  logger.info(functions.getMessageLog(ip,nombreUsuario,method,XML_RETURN,''));
                                  resolve({
                                    RESULTADO : XML_RETURN
                                  });

                                }
                                
                              });

                          }
                          
                        }
                        
                      });

                    }
                    
                  });

                });

            }
            
          },

      }
  }
};

//DIRECCIONANDO LOS METODOS ANTIGUOS
function redirectInfoBasicaServicioHFCxCliente(args, cb, headers, req){

  return service.MyService.MyPort.getInfoBasicaServicioHFCxCliente(args, cb, headers, req);
  
}

function redirectgetInfoEstadoServicioHFCxCliente(args, cb, headers, req){

  return service.MyService.MyPort.getInfoEstadoServicioHFCxCliente(args, cb, headers, req);
  
}

/*
//HABILITAMOS PARA QUE RECIBA PETICIONES TIPO GET EN DESARROLLO EN LA RUTA: http://10.123.200.222:8091/ 
api
  .get('/', (req, res) => {
              console.log('Se ha realizado una visita');
              res
                .set({ 'content-type': 'text/html; charset=utf-8' })
                .end('<h1>Hola 😀 buen dia a todos !!!</h1>'+Date('y-m-d h::m::s'))
  })
*/

//CARGAMOS EL SERVICIO SOAP
soap.listen(api, '/services/HFC', service, xml, function(){
      
      console.log('SERVICE SOAP INITIALIZED');
      //console.log(process.env.LIFETIME_TOKEN);
      //Correr el servidor:   > npm run dev  o   node server.js

});

module.exports = api