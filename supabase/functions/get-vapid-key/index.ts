import { corsHeaders } from '../_shared/cors.ts'

const VAPID_PUBLIC_KEY = Deno.env.get('PUSH_VAPID_PUBLIC_KEY')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!VAPID_PUBLIC_KEY) {
    return new Response(
      JSON.stringify({ error: 'VAPID public key not configured' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  return new Response(
    JSON.stringify({ vapidPublicKey: VAPID_PUBLIC_KEY }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
})
