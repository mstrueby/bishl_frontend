import { useState } from 'react';
import { useRouter } from 'next/router';
import useAuth from '../hooks/useAuth';
import Layout from '../components/Layout';
import { setDefaultResultOrder } from 'dns';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const { setUser } = useAuth();
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

    if (res.ok) {
      const user = await res.json();
      setUser(user);
      router.push('/');
    } else {
      // Handle error here
      const errData = await res.json();
      console.log(errData);
      setError(errData);
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
