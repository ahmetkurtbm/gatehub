"use client";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
export function SignOutButton(){const[loading,setLoading]=useState(false);return <button className="ui-button ui-button-neutral signout-button" type="button" disabled={loading} onClick={async()=>{setLoading(true);await authClient.signOut({fetchOptions:{onSuccess:()=>{window.location.href="/login"}}})}}><LogOut size={15}/>{loading?"Çıkılıyor…":"Çıkış"}</button>}
