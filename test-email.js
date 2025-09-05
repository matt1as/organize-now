// Use global fetch in Node.js 18+

async function testEmailStructure() {
  // First, trigger an email
  const email = 'test-' + Date.now() + '@test.com';
  console.log('Sending magic link to:', email);
  
  const response = await fetch('http://localhost:54321/auth/v1/otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    },
    body: JSON.stringify({
      email: email,
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/callback'
      }
    })
  });
  
  const result = await response.json();
  console.log('Response:', result);
  
  // Wait a bit for email to arrive
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Check Inbucket API
  const inbucketResponse = await fetch('http://localhost:54324/api/v1/mailbox/' + email);
  const emails = await inbucketResponse.json();
  console.log('Emails received:', emails.length);
  
  if (emails.length > 0) {
    const latestEmail = emails[0];
    console.log('Latest email ID:', latestEmail.id);
    
    // Get email content
    const emailContent = await fetch(`http://localhost:54324/api/v1/mailbox/${email}/${latestEmail.id}`);
    const content = await emailContent.json();
    
    // Extract the confirm link from HTML body
    const htmlBody = content.body.html || '';
    const linkMatch = htmlBody.match(/href="([^"]*auth\/callback[^"]*)"/);
    
    if (linkMatch) {
      console.log('\nFound magic link:', linkMatch[1]);
      
      // Parse the URL
      const url = new URL(linkMatch[1]);
      console.log('Host:', url.host);
      console.log('Pathname:', url.pathname);
      console.log('Token param:', url.searchParams.get('token'));
      console.log('Type param:', url.searchParams.get('type'));
    } else {
      console.log('No magic link found in email');
      console.log('HTML body preview:', htmlBody.substring(0, 500));
    }
  }
}

testEmailStructure().catch(console.error);
