"use client";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function DeleteClientButton({clientId,clientName}:{clientId:string;clientName:string}){const router=useRouter();const[loading,setLoading]=useState(false);async function remove(){if(!confirm(`“${clientName}” uygulaması silinsin mi? Bu işlem geri alınamaz.`))return;setLoading(true);const response=await fetch(`/api/oauth-clients/${encodeURIComponent(clientId)}`,{method:"DELETE"});if(response.ok)router.refresh();else{alert("Uygulama silinemedi.");setLoading(false)}}return <button onClick={remove} disabled={loading} className="ui-button ui-button-danger"><Trash2 size={15}/>{loading?"Siliniyor…":"Sil"}</button>}
