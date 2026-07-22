"use client";
import { Ban, CheckCircle2 } from "lucide-react";
import { useState } from "react";
export function AdminControl({kind,id,disabled}:{kind:"user"|"app";id:string;disabled:boolean}){const[busy,setBusy]=useState(false);async function run(){setBusy(true);const response=await fetch("/api/admin/manage",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind,id,disabled:!disabled})});if(response.ok)window.location.reload();else setBusy(false)}return <button className={`ui-button ${disabled?"ui-button-neutral":"ui-button-danger"}`} disabled={busy} onClick={run}>{disabled?<CheckCircle2 size={15}/>:<Ban size={15}/>} {busy?"Bekle…":disabled?"Etkinleştir":kind==="user"?"Engelle":"Devre dışı bırak"}</button>}
