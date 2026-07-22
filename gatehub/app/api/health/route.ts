export function GET(){return Response.json({status:"ok",service:"gatehub",timestamp:new Date().toISOString()},{headers:{"Cache-Control":"no-store"}})}
