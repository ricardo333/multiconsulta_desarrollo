//DECLARAMOS LAS VARIABLES DE ENTORNO
process.env.ENV = 'prod'
process.env.PATH_API_REST = '../proyectoHFC/.env' 

if (process.env.ENV === 'dev') {

  process.env.CONFIG_DB_HOST = 'localhost'
  process.env.CONFIG_DB_NAME = 'ws_soap_api'
  process.env.CONFIG_DB_USER = 'root'
  process.env.CONFIG_DB_PASSWORD = ''

  
  process.env.PORT = 3000   
  process.env.CONFIG_URL_AUTHENTICATION = 'http://proyectohfc.test/api/autenticacion'
  process.env.CONFIG_URL_ESTADO_CLIENTE_HFC = 'http://proyectohfc.test/api/estadoClienteHFC'
  process.env.CONFIG_URL_ESTADO_SERVICIO_HFC = 'http://proyectohfc.test/api/estadoServicioHFC'

  process.env.CONFIG_URL_PRUEBAS_CABLE_MODEM = 'http://proyectohfc.test/api/pruebasCablemodem'
  process.env.CONFIG_URL_PRUEBAS_CABLE_MODEM_IW = 'http://proyectohfc.test/api/pruebasCablemodemIW'

} else {

  process.env.CONFIG_DB_HOST = '10.123.200.220'
  process.env.CONFIG_DB_NAME = 'ws_soap_api'
  process.env.CONFIG_DB_USER = 'rfalla'
  process.env.CONFIG_DB_PASSWORD = 'rolo2018'
 
  process.env.PORT = 8091
  process.env.CONFIG_URL_AUTHENTICATION = 'http://10.123.200.222/api/autenticacion'
  process.env.CONFIG_URL_ESTADO_CLIENTE_HFC = 'http://10.123.200.222/api/estadoClienteHFC'
  process.env.CONFIG_URL_ESTADO_SERVICIO_HFC = 'http://10.123.200.222/api/estadoServicioHFC'

  process.env.CONFIG_URL_PRUEBAS_CABLE_MODEM = 'http://10.123.200.222/api/pruebasCablemodem'
  process.env.CONFIG_URL_PRUEBAS_CABLE_MODEM_IW = 'http://10.123.200.222/api/pruebasCablemodemIW'

}