//DECLARAMOS LAS FUNCIONES
exports.getIpCliente = function (req)
{

  ipString = req.headers["X-Forwarded-For"] || req.connection.remoteAddress;
  return ipString.replace('::ffff:', '')

}

exports.getMessageLog = function (ip,nombreUsuario,method,message,sistema) 
{

return `
Descripción del motivo:Acceso
Recurso al que se accede: Servicio
Tipo de acceso: Consulta
IP de cliente: ${ip} 
Login de usuario: ${nombreUsuario} 
Sistema Operativo: ${sistema}
Metodo a que se accede: POST : ${method}
Descripcion del motivo de evento: `+message+`\n`;

}