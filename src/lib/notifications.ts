import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const fromEmail = process.env.SYSTEM_FROM_EMAIL || 'onboarding@resend.dev'

interface EmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not defined. Email logged to console:')
    console.log(`To: ${to}\nSubject: ${subject}\nBody: ${html}`)
    return
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `Actors Studio <${fromEmail}>`,
      to,
      subject,
      html,
    })

    if (error) throw error
    return data
  } catch (err) {
    console.error('Failed to send email via Resend:', err)
  }
}

// Map notification types to html templates
export async function dispatchNotification(params: {
  targetEmail: string
  type: 'producer_approved' | 'producer_rejected' | 'application_shortlisted' | 'audition_scheduled' | 'talent_selected'
  payload: Record<string, any>
}) {
  let subject = ''
  let html = ''

  switch (params.type) {
    case 'producer_approved':
      subject = 'Welcome to Actors Studio! Your Producer Account is Approved'
      html = `<p>Hi ${params.payload.company_name},</p><p>Congratulations! Your business account has been verified. You can now publish casting calls and view talent details.</p>`
      break
    case 'producer_rejected':
      subject = 'Actors Studio — Producer Verification Update'
      html = `<p>Hi ${params.payload.company_name},</p><p>Your application was not approved for the following reason:</p><blockquote style="color:red;">"${params.payload.reason}"</blockquote><p>Please update your onboarding details and re-upload supporting documents.</p>`
      break
    case 'application_shortlisted':
      subject = 'Good News! You have been Shortlisted!'
      html = `<p>Hi,</p><p>Your application to the casting call <strong>${params.payload.call_title}</strong> has been shortlisted by the casting director.</p><p>Check your dashboard for upcoming schedule slots.</p>`
      break
    case 'audition_scheduled':
      subject = 'Audition Scheduled — Action Required'
      html = `<p>Hi,</p><p>An audition has been scheduled for you!</p><ul><li><strong>Mode:</strong> ${params.payload.mode}</li><li><strong>Time:</strong> ${params.payload.time}</li><li><strong>Location/Link:</strong> <a href="${params.payload.link}">${params.payload.link}</a></li></ul><p>Please review and confirm your availability.</p>`
      break
    case 'talent_selected':
      subject = 'Congratulations! You have been Selected!'
      html = `<p>Hi,</p><p>You have been officially SELECTED for the role in <strong>${params.payload.call_title}</strong>!</p><p>A representative from the studio will contact you shortly regarding booking contracts.</p>`
      break
  }

  await sendEmail({
    to: params.targetEmail,
    subject,
    html,
  })
}
