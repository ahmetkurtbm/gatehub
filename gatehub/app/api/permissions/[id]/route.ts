import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
export async function DELETE(_request:Request,{params}:{params:Promise<{id:string}>}){const session=await auth.api.getSession({headers:await headers()});if(!session)return Response.json({error:"Yetkisiz."},{status:401});const {id}=await params;const consent=await prisma.oauthConsent.findFirst({where:{id,userId:session.user.id}});if(!consent)return Response.json({error:"Bulunamadı."},{status:404});await prisma.$transaction([prisma.oauthAccessToken.deleteMany({where:{userId:session.user.id,clientId:consent.clientId}}),prisma.oauthRefreshToken.deleteMany({where:{userId:session.user.id,clientId:consent.clientId}}),prisma.oauthConsent.delete({where:{id}})]);await recordAudit({action:"oauth.consent.revoked",userId:session.user.id,targetType:"oauthClient",targetId:consent.clientId});return Response.json({ok:true});}
