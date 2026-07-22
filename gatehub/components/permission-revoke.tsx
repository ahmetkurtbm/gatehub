"use client";
import { useState } from "react";
import { Unlink } from "lucide-react";
export function PermissionRevoke({consentId}:{consentId:string}){const[busy,setBusy]=useState(false);return <button className="ui-button ui-button-danger" disabled={busy} onClick={async()=>{if(!confirm("Bu uygulamanın hesap erişimi kaldırılsın mı?"))return;setBusy(true);const response=await fetch(`/api/permissions/${consentId}`,{method:"DELETE"});if(response.ok)window.location.reload();else setBusy(false)}}><Unlink size={15}/>{busy?"Kaldırılıyor…":"Erişimi kaldır"}</button>}
