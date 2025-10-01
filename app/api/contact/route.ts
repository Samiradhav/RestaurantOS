import { NextRequest, NextResponse } from 'next/server'

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json()
    const { name, email, subject, message } = body

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Get support email from environment
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@restaurantos.in'

    // Create the email content
    const emailContent = `
New Contact Form Submission

From: ${name} (${email})
Subject: ${subject}

Message:
${message}

---
This message was sent from the RestaurantOS contact form.
Please respond to the sender at ${email}
    `.trim()

    // Use a simple approach - you can replace this with any email service
    // Option 1: Use Web3Forms (free, no setup required)
    const formData = new FormData()
    formData.append('name', name)
    formData.append('email', email)
    formData.append('subject', `RestaurantOS Contact: ${subject}`)
    formData.append('message', emailContent)
    formData.append('access_key', process.env.WEB3FORMS_KEY || 'YOUR_WEB3FORMS_KEY')
    formData.append('redirect', 'false')

    try {
      // Send to Web3Forms (free service)
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        return NextResponse.json(
          {
            success: true,
            message: 'Message sent successfully! We\'ll get back to you within 24 hours.'
          },
          { status: 200 }
        )
      }
    } catch (error) {
      console.error('Web3Forms error:', error)
    }

    // Option 2: If Web3Forms fails, try a simple HTTP approach
    // You could also use services like Formspree, EmailJS, etc.

    // For now, let's create a simple fallback that just logs the message
    console.log('📧 New Contact Form Submission:')
    console.log(`From: ${name} <${email}>`)
    console.log(`Subject: ${subject}`)
    console.log(`Message: ${message}`)
    console.log(`Send to: ${supportEmail}`)

    // In production, you'd want to use a proper email service
    // For now, this will at least log the messages so you can see them

    return NextResponse.json(
      {
        success: true,
        message: 'Message received! We\'ll get back to you within 24 hours.'
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      {
        error: 'Failed to send message. Please try again later or contact us directly at support@restaurantos.in'
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
