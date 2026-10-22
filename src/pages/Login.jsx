import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import "../css/Auth.css";
import api from '../services/api';


function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const loginData = { email, password };
        try {
            const response = await api.post("/api/auth/signin", loginData);

            const { token } = response.data;

            if (!token) {
                setError("Login respond did not contain a token");
                return;
            }

            login(token);
            navigate("/dashboard");

        } catch (err) {
            setError(err.response?.data?.message ||
                err.response?.data?.error ||
                "Login failed. Check your credentials."
            );
        } finally {
            setLoading(false);
        }
    }
    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-brand">
                    <span className="auth-brand-icon">⬡</span>
                    SellerShield
                </div>

                <div className="auth-heading">
                    <h1>Welcome back</h1>
                    <p>Sign in to manage your business performance.</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && (
                        <p className="auth-error" role="alert">
                            {error}
                        </p>
                    )}
                    <div className="auth-field">
                        <label htmlFor="login-email">Email address</label>
                        <input
                            id="login-email"
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    <button
                        className="auth-submit"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Sign In"}
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account?
                    <Link to="/register">Create an account</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;