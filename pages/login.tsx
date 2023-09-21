import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { setDefaultResultOrder } from 'dns';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch('/api/login', {
      body: JSON.stringify({
        email,
        password
      }),
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST'
    });

    const result = await res.json();

    if (res.ok) {
      //const user = await result.json();
      router.push('/');
    } else {
      // Handle error here
      console.log(result.detail);
    }
  };

  return (
    <Layout>
      <form onSubmit={handleSubmit}>
        <label>
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        <label>
          <span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        <button type="submit">Login</button>
      </form>
    </Layout>
  );
}
