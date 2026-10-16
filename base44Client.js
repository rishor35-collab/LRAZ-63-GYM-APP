// Temporary compatibility layer: original pages keep their existing import paths.
// CRUD is routed to Supabase. Advanced Base44 features require separate migration.
import { requireSupabase } from '@/lib/supabase';
const tableName = name => name.replace(/([a-z0-9])([A-Z])/g,'$1_$2').toLowerCase();
const unsupported = name => { throw new Error(`${name} has not yet been migrated from Base44.`); };
function entity(name) {
 const table = tableName(name);
 const db = () => requireSupabase().from(table);
 const unwrap = ({data,error}) => { if(error)throw error;return data; };
 const query = (filters={}) => { let q=db().select('*'); for(const [k,v] of Object.entries(filters||{})) {if(k.startsWith('$')) return unsupported(`${name} advanced filter`); if(v&&typeof v==='object') { if('$in' in v)q=q.in(k,v.$in);else if('$gte' in v)q=q.gte(k,v.$gte);else if('$lte' in v)q=q.lte(k,v.$lte);else return unsupported(`${name} operator ${k}`); }else q=q.eq(k,v);}return q;};
 return {
  list: async (sort='-created_date',limit=100)=>{let q=db().select('*');if(typeof sort==='string')q=q.order(sort.replace(/^-/,'') ,{ascending:!sort.startsWith('-')});return unwrap(await q.limit(limit));},
  filter: async (filters={}, sortOrOptions='-created_date', limit=100) => {
    // Base44 supports both filter(filters, sort, limit) and filter(filters, options).
    const options = typeof sortOrOptions === 'string'
      ? { sort: sortOrOptions, limit }
      : (sortOrOptions || {});
    let q = query(filters);
    if (options.sort) q = q.order(options.sort.replace(/^-/, ''), { ascending: !options.sort.startsWith('-') });
    const pageSize = Math.max(1, Math.min(Number(options.limit) || 100, 1000));
    const offset = Number(options.cursor) || 0;
    const rows = unwrap(await q.range(offset, offset + pageSize));
    const hasMore = rows.length > pageSize;
    const result = rows.slice(0, pageSize);
    // Existing Base44 screens use BOTH array indexing and page.items pagination.
    Object.defineProperties(result, {
      items: { value: result, enumerable: false },
      has_more: { value: hasMore, enumerable: false },
      next_cursor: { value: hasMore ? String(offset + pageSize) : null, enumerable: false },
    });
    return result;
  },
  get: async id=>unwrap(await db().select('*').eq('id',id).single()),
  create: async data=>unwrap(await db().insert(data).select().single()),
  update: async(id,data)=>unwrap(await db().update(data).eq('id',id).select().single()),
  delete: async id=>unwrap(await db().delete().eq('id',id)),
  count: async filters=>{const {count,error}=await query(filters).select('*',{count:'exact',head:true});if(error)throw error;return count ?? 0;},
  aggregate:()=>unsupported(`${name}.aggregate`),
  bulkCreate: async rows=>unwrap(await db().insert(rows).select()),
 };
}
const auth={
 me:async()=>{const {data,error}=await requireSupabase().auth.getUser();if(error)throw error;const u=data.user;if(!u)throw Error('Not signed in');return {...u.user_metadata,id:u.id,email:u.email};},
 isAuthenticated:async()=>!!(await requireSupabase().auth.getSession()).data.session,
 loginViaEmailPassword:async(email,password)=>{const {data,error}=await requireSupabase().auth.signInWithPassword({email,password});if(error)throw error;return data;},
 register:async({email,password,...metadata})=>{const {data,error}=await requireSupabase().auth.signUp({email,password,options:{data:metadata}});if(error)throw error;return data;},
 logout:async()=>{const {error}=await requireSupabase().auth.signOut();if(error)throw error;},
 redirectToLogin:()=>window.location.assign('/login'),
 updateMe:async data=>{const {data:res,error}=await requireSupabase().auth.updateUser({data});if(error)throw error;return res.user;},
 loginWithProvider:async provider=>{const {data,error}=await requireSupabase().auth.signInWithOAuth({provider,options:{redirectTo:window.location.origin}});if(error)throw error;return data;},
 resetPasswordRequest:async email=>{const {error}=await requireSupabase().auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/reset-password`});if(error)throw error;},
 resetPassword:async({newPassword})=>{const {error}=await requireSupabase().auth.updateUser({password:newPassword});if(error)throw error;},
 verifyOtp:async({email,otpCode})=>{const {data,error}=await requireSupabase().auth.verifyOtp({email,token:otpCode,type:'email'});if(error)throw error;return data;},
 resendOtp:async email=>{const {error}=await requireSupabase().auth.resend({type:'signup',email});if(error)throw error;},
 setToken:()=>unsupported('setToken'),
};
export const base44={auth,entities:new Proxy({}, {get:(_,name)=>entity(String(name))}),functions:{invoke:()=>unsupported('functions.invoke')},integrations:{Core:new Proxy({}, {get:(_,name)=>()=>unsupported(`integrations.Core.${String(name)}`)})}};
