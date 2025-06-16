// A simple, dependency-free home page for debugging.
export default function HomePage() {
  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Debug Home Page</h1>
      <p style={{ fontSize: '1.2rem', marginTop: '1rem' }}>If you can see this, the basic page rendering is working.</p>
      <p style={{ marginTop: '2rem', color: '#666' }}>The next step is to check the Vercel logs and environment variables to fix the authentication crash.</p>
    </div>
  )
}
