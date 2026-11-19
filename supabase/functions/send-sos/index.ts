// Deploy with: supabase functions deploy send-sos
// Configure Resend: RESEND_API_KEY, NOTIFICATION_FROM
// Optional Twilio: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

  try {
    const body = await request.json()
    const { alertId, name, locationUrl, activatedAt, contacts, status } = body
    if (!alertId || !Array.isArray(contacts) || contacts.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing alert or contacts' }), { status: 400, headers: corsHeaders })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    )
    const token = authHeader.replace(/^Bearer\s+/i, '')
    const { data: authData, error: authError } = await supabase.auth.getUser(token)
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const subject = status === 'sharing-ended'
      ? 'LOCATION SHARING ENDED - AIDLOCATE'
      : 'EMERGENCY ALERT - AIDLOCATE'
    const message = status === 'sharing-ended'
      ? `AidLocate user ${name || 'Unknown'} has stopped live location sharing.\n\nAlert ID:\n${alertId}\n\nSharing ended at:\n${activatedAt || new Date().toISOString()}\n\nNo further live location updates will be sent.\n\nThis is an automated notification from AidLocate.`
      : `An emergency SOS alert has been activated by ${name || 'an AidLocate user'}.\n\nThe user may need immediate assistance.\n\nLast known location:\n${locationUrl || 'Location unavailable'}\n\nAlert activated at:\n${activatedAt || new Date().toISOString()}\n\nPlease contact the user immediately and check their safety.\n\nThis is an automated emergency notification from AidLocate.`
    const resendKey = Deno.env.get('RESEND_API_KEY')
    const from = Deno.env.get('NOTIFICATION_FROM')
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioFrom = Deno.env.get('TWILIO_FROM_NUMBER')
    const results: Array<Record<string, unknown>> = []

    for (const contact of contacts) {
      const preferred = contact.notification_preference || 'SMS'
      let deliveryStatus = 'not_configured'

      if (preferred === 'Email' && resendKey && from && contact.email) {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from, to: [contact.email], subject, text: message }),
        })
        deliveryStatus = response.ok ? 'accepted' : `failed:${response.status}`
      } else if (preferred === 'SMS' && twilioSid && twilioToken && twilioFrom && contact.phone) {
        const credentials = btoa(`${twilioSid}:${twilioToken}`)
        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: 'POST',
          headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ From: twilioFrom, To: contact.phone, Body: message }),
        })
        deliveryStatus = response.ok ? 'accepted' : `failed:${response.status}`
      }

      await supabase.from('notification_logs').insert({
        alert_id: alertId,
        contact_id: contact.id,
        delivery_method: preferred,
        delivery_status: deliveryStatus,
      })
      results.push({ contactId: contact.id, deliveryStatus })
    }

    return new Response(JSON.stringify({ status: 'completed', results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: corsHeaders })
  }
})
