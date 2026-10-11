import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { clearAuthError, login, register } from './authSlice';
import { validateAuth } from '../../utils/validation';

export function AuthPage({ registering = false }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const { currentUserId, status, error } = useSelector((s) => s.auth);
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [validation, setValidation] = useState(null);
  useEffect(() => {
    dispatch(clearAuthError());
    setValidation(null);
  }, [dispatch, registering]);
  const destination = location.state?.from;
  if (currentUserId)
    return (
      <Navigate
        to={
          typeof destination === 'string' &&
          destination.startsWith('/') &&
          !destination.startsWith('//') &&
          !/^\/(login|register)(\?|$)/.test(destination)
            ? destination
            : '/events'
        }
        replace
      />
    );
  async function submit(e) {
    e.preventDefault();
    const invalid = validateAuth(values, registering);
    setValidation(invalid);
    if (!invalid) await dispatch((registering ? register : login)(values));
  }
  const field = (name, label, type = 'text', autoComplete) => (
    <label className="field">
      {label}
      <input
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        value={values[name]}
        onChange={(e) => setValues({ ...values, [name]: e.target.value })}
      />
    </label>
  );
  return (
    <div className="page auth-page">
      <section className="auth-story">
        <p className="eyebrow">YOUR NEXT CHAPTER</p>
        <h1>
          More moments.
          <br />
          <em>More memories.</em>
        </h1>
        <p className="lead">Keep all the experiences you’re looking forward to in one place.</p>
        <div className="auth-art" aria-hidden="true">
          <span>
            SHOW
            <br />
            UP.
          </span>
          <ArrowUpRight size={90} strokeWidth={1} />
        </div>
      </section>
      <section className="auth-panel">
        <p className="eyebrow">LET’S GET YOU THERE</p>
        <h2>{registering ? 'Create your account' : 'Welcome back'}</h2>
        <p className="muted">
          {registering
            ? 'Your calendar is about to get more interesting.'
            : 'Your next experience is waiting.'}
        </p>
        <form onSubmit={submit} noValidate>
          {registering && field('name', 'Your name', 'text', 'name')}
          {field('email', 'Email address', 'email', 'email')}
          {field(
            'password',
            'Password',
            'password',
            registering ? 'new-password' : 'current-password',
          )}
          {registering && field('confirmPassword', 'Confirm password', 'password', 'new-password')}
          {(validation || error) && (
            <p role="alert" className="form-error">
              {validation || error}
            </p>
          )}
          <button className="button primary w-full" disabled={status === 'loading'}>
            {status === 'loading' ? 'One moment…' : registering ? 'Create account' : 'Log in'}
            <ArrowUpRight size={17} />
          </button>
        </form>
        <p className="auth-switch">
          {registering ? 'Already have an account?' : 'New to Gather?'}{' '}
          <Link
            className="text-link"
            to={registering ? '/login' : '/register'}
            state={location.state}
          >
            {registering ? 'Log in' : 'Create an account'}
          </Link>
        </p>
        <p className="demo-note">
          Demo account · saved only in this browser. Use a password you don’t use elsewhere.
        </p>
      </section>
    </div>
  );
}
