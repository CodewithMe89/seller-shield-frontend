import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import "../css/Auth.css";

function Register() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSumbit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setError("");

        const registerData = { name, email, password };
        try {
            const response = await api.post("/api/auth/signup", registerData);

            setMessage(response.data.message || "SignUp successful");

            setName("");
            setEmail("");
            setPassword("");

            setTimeout(() => {
                navigate("/login");
            }, 1500);
        } catch (err) {
            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                 err?.message ||
                "SignUp failed"
            )
        } finally {
            setLoading(false);
        }
    }
    return (
        <div className="auth-page">
            <div className="auth-container auth-register">
                <div className="auth-brand">
                    <span className="auth-brand-icon">⬡</span>
                    SellerShield
                </div>

                <div className="auth-heading">
                    <h1>Create your account</h1>
                    <p>Start tracking your business performance.</p>
                </div>

                <form className="auth-form" onSubmit={handleSumbit}>
                    {error && (
                        <p className="auth-error" role="alert">
                            {error}
                        </p>
                    )}

                    
                    {message && (
                        <p className="auth-success" role="status">
                            {message}
                        </p>
                    )}
                    
                    <div className="auth-field">
                        <label htmlFor="register-name">Full name</label>
                        <input
                            id="register-name"
                            type="text"
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your full name"
                            autoComplete="name"
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="register-email">Email address</label>
                        <input
                            id="register-email"
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
                        <label htmlFor="register-password">Password</label>
                        <input
                            id="register-password"
                            type="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Create a password"
                            autoComplete="new-password"
                            required
                        />
                    </div>

                    <button
                        className="auth-submit"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account?
                    <button
                        type="button"
                        onClick={() => navigate("/login")}
                    >
                        Sign in
                    </button>
                </p>
            </div>
        </div>
    );
}

export default Register;