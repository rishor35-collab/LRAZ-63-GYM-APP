import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { requireSupabase, supabase } from './supabase';
const AuthContext = createContext(null);
const normalize = (u) => u ? { ...u.user_metadata, id: u.id, email: u.email, full_name: u.user_metadata?.full_name || u.email?.split('@')[0] } : null;
export function AuthProvider({ children }) {
 const [user,setUser]=useState(null);
 const [isLoadingAuth,setLoading]=useState(true);
 const checkUserAuth=useCallback(async()=>{if(!supabase){setLoading(false);return;} const {data,error}=await supabase.auth.getUser();setUser(error?null:normalize(data.user));setLoading(false);},[]);
 useEffect(()=>{checkUserAuth(); if(!supabase)return;const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{setUser(normalize(session?.user));setLoading(false);});return()=>subscription.unsubscribe();},[checkUserAuth]);
 const logout=async(redirect=true)=>{await requireSupabase().auth.signOut();setUser(null);if(redirect)window.location.assign('/login');};
 const navigateToLogin=()=>window.location.assign('/login');
 return <AuthContext.Provider value={{user,isAuthenticated:!!user,isLoadingAuth,isLoadingPublicSettings:false,authError:null,appPublicSettings:{},authChecked:!isLoadingAuth,logout,navigateToLogin,checkUserAuth,checkAppState:checkUserAuth}}>{children}</AuthContext.Provider>;
}
export function useAuth(){const ctx=useContext(AuthContext);if(!ctx)throw Error('useAuth must be used within AuthProvider');return ctx;}
